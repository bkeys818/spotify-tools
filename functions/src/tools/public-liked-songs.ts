import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { error, warn, info } from 'firebase-functions/logger'
import { db } from '../init'
import Spotify from '../spotify'
import { forEvery, formatError, mapWithConcurrency } from '../utils'
import { SpotifyError } from '../spotify/error'
import { secrets } from '../env'

const tool = 'public-liked-songs'

/** Users synced at once. Spotify rate limits per app, so this is a shared budget. */
const USER_CONCURRENCY = 2

type Document = {
	refresh_token: string
	playlist_id?: string
	uid: string
}

type CreateParams = {
	code: string
	origin: string
}
type CreateResponse = Promise<{
	playlistId: string
	userId: string
}>

export const create = onCall<CreateParams, CreateResponse>(
	{ secrets, maxInstances: 3 },
	async ({ data, auth }) => {
		if (!auth) throw new HttpsError('unauthenticated', 'User must be authenticated.')

		const spotify = new Spotify({
			clientId: process.env.SPOTIFY_CLIENT_ID,
			clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
			redirectUri: data.origin + '/authorize'
		})
		const { refresh_token } = await spotify.authorizationCodeGrant(data.code).catch(err => {
			if (err instanceof Error && err.message.includes('invalid_grant')) {
				warn('Unable to get Spotify refresh token.', {
					tool,
					error: formatError(err)
				})
				throw new HttpsError('unauthenticated', 'Spotify authorization denied')
			}
			throw err
		})
		const user = await spotify.getMe()

		const ref = db.collection(tool).doc(user.id)
		let doc = await ref.get()

		let docData: Document
		if (doc.exists) {
			docData = doc.data() as Document
			await ref.update({ refresh_token })
		} else {
			await ref.create({ refresh_token, uid: auth.uid })
			doc = await ref.get() // Do I need this line?
			docData = doc.data() as Document
		}

		// Don't have playlist id
		if (!docData.playlist_id) {
			// check to see if playlist already exists
			const playlists = await spotify.getMyPlaylists()
			const playlistName = name(user.display_name)
			for (const playlist of playlists) {
				if (playlist.name == playlistName) docData.playlist_id = playlist.id
			}
			// if playlist doesn't exist
			if (!docData.playlist_id) {
				const playlist = await spotify.createPlaylist({
					name: playlistName,
					description: description(),
					public: true
				})
				docData.playlist_id = playlist.id
			}
			await ref.update({ playlist_id: docData.playlist_id })
		}

		if (!(await spotify.usersFollowPlaylist([docData.playlist_id]))[0]) {
			await ref.delete()
			info('User deleted synced playlist', { tool })
			throw new HttpsError(
				'not-found',
				'You may have deleted the synced playlist. Refresh to restore it.'
			)
		}

		return { playlistId: docData.playlist_id, userId: user.id }
	}
)

type PopulateParams = {
	userId: string
	origin: string
}

export const populate = onCall<PopulateParams>(
	{ secrets, timeoutSeconds: 300, maxInstances: 3 },
	async ({ data, auth }) => {
		if (!auth) throw new HttpsError('unauthenticated', 'User must be authenticated.')
		const ref = db.doc(tool + '/' + data.userId)
		const doc = await ref.get()
		if (!doc.exists) {
			const msg = "Couldn't find any data for user."
			warn(msg, {
				spotifyUserId: data.userId,
				firebaseUid: auth.uid
			})
			throw new HttpsError('not-found', msg)
		}
		const docData = doc.data() as Document
		if (!docData.playlist_id) {
			const msg = "Couldn't find a playlist for user."
			warn(msg, {
				spotifyUserId: data.userId,
				firebaseUid: auth.uid
			})
			throw new HttpsError('not-found', msg)
		}
		const spotify = new Spotify({
			clientId: process.env.SPOTIFY_CLIENT_ID,
			clientSecret: process.env.SPOTIFY_CLIENT_SECRET
		})
		if (!docData.refresh_token) {
			warn("Couldn't find Spotify refresh token.")
			throw new HttpsError('failed-precondition', 'Unable to find Spotify authorization')
		}
		spotify.setRefreshToken(docData.refresh_token)
		try {
			await spotify.refreshAccessToken()
		} catch (err) {
			if (err instanceof Error && err.message.includes('invalid_grant')) {
				if (err.message.startsWith('Refresh token revoked')) {
					await ref.update({ refresh_token: FirebaseFirestore.FieldValue.delete() })
					info('Spotify access was revoked.', { spotifyUserId: doc.id })
					throw new HttpsError('unauthenticated', 'Spotify authorization was revoked')
				} else {
					warn('Failed to refresh Spotify access token.', {
						tool,
						error: formatError(err)
					})
					throw new HttpsError('unauthenticated', 'Spotify authorization denied')
				}
			}
			throw err
		}

		try {
			return await update(spotify, docData.playlist_id)
		} catch (err) {
			const msg = 'Failed to populate playlist.'
			error(msg, {
				tool,
				error: formatError(err),
				spotifyUserId: doc.id,
				firebaseUid: docData.uid
			})
			throw new HttpsError('unknown', msg, err)
		}
	}
)

export const sync = onSchedule(
	{ schedule: '0 0 * * *', secrets, timeoutSeconds: 540, maxInstances: 1 },
	async () => {
		const docRefs = await db.collection(tool).listDocuments()
		let rateLimited = 0
		// Bounded rather than all at once: Spotify's limit is per app, so every
		// user in flight is spending from the same budget.
		await mapWithConcurrency(docRefs, USER_CONCURRENCY, async ref => {
			let data: Document | undefined
			try {
				const doc = await ref.get()
				data = doc.data() as Document
				const spotify = new Spotify({
					clientId: process.env.SPOTIFY_CLIENT_ID,
					clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
					refreshToken: data.refresh_token
				})
				await spotify.refreshAccessToken()
				if (!data.playlist_id) return await ref.delete()
				if (!(await spotify.usersFollowPlaylist([data.playlist_id]))[0])
					return await ref.delete()
				return await update(spotify, data.playlist_id)
			} catch (err) {
				if (err instanceof SpotifyError && err.status == 429) rateLimited++
				return error('Unable to sync playlist', {
					tool,
					error: formatError(err),
					spotifyUserId: ref.id,
					firebaseUid: data?.uid
				})
			}
		})
		// Without this, a rate-limited wipeout and a clean run look identical.
		if (rateLimited > 0)
			error('Ran out of Spotify rate limit during sync.', {
				tool,
				rateLimited,
				total: docRefs.length
			})
		return
	}
)

async function update(spotify: Spotify, playlistId: string) {
	// Sequential, not Promise.all: each of these is itself a paginated fan-out,
	// so running both at once doubles the peak burst against a shared quota.
	const playlistTracks = await spotify.getPlaylistItems(playlistId)
	const savedTracks = await spotify.getMySavedTracks()
	const playlistTrackUris = playlistTracks
		.map(item => item.item?.uri)
		.filter((v): v is string => v !== undefined)
	const savedTrackUris = savedTracks.map(item => item.track.uri)

	const removedTrackIds = playlistTrackUris.filter(id => !savedTrackUris.includes(id))
	const addedTrackIds = savedTrackUris.filter(id => !playlistTrackUris.includes(id)).reverse()

	if (removedTrackIds.length > 0)
		await forEvery(removedTrackIds, 100, ids => spotify.removeItemsToPlaylist(playlistId, ids))
	if (addedTrackIds.length > 0)
		await forEvery(addedTrackIds, 100, ids => spotify.addItemsToPlaylist(playlistId, ids))

	await spotify.changePlaylistDetails(playlistId, { description: description() })

	return playlistId
}

function name(userName = 'User') {
	return userName + "'s Liked Songs"
}
function description() {
	const now = new Date()
	const time = now.toLocaleTimeString('en-US')
	const date = now.toLocaleDateString('en-US')
	return `Created at "https://spotify-tools/benkeys.com". Last updated on ${time} ${date}.`
}
