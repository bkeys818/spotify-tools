import * as functions from 'firebase-functions'
import { db } from '../firestore'
import { Spotify } from '../spotify'
import { forEvery } from '../utils'
import { secrets } from '../env'

interface Document {
	refresh_token: string
	playlist_id?: string
}

export const createPublicLikedSongs = functions
	.runWith({ secrets })
	.https.onCall(async (data: Data, context) => {
		if (!context.auth)
			throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.')

		const spotify = new Spotify({
			clientId: process.env.SPOTIFY_CLIENT_ID,
			clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
			redirectUri: data.origin + '/authorize'
		})

		const ref = db.collection('public-liked-songs').doc(context.auth.uid)
		let doc = await ref.get()

		let docData: Document
		if (doc.exists) {
			docData = doc.data() as Document
			spotify.setRefreshToken(docData.refresh_token)
			await spotify.refreshAccessToken()
		} else {
			const { refresh_token } = await spotify.authorizationCodeGrant(data.code)
			await ref.create({ refresh_token })
			doc = await ref.get() // Do I need this line?
			docData = doc.data() as Document
		}

		const user = await spotify.getMe()

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
				const playlist = await spotify.createPlaylist(user.id, {
					name: playlistName,
					description: description(),
					public: true
				})
				docData.playlist_id = playlist.id
			}
			await ref.update({ playlist_id: docData.playlist_id })
		}

		if (!(await spotify.usersFollowPlaylist(docData.playlist_id, [user.id]))[0]) {
			await ref.delete()
			throw new functions.https.HttpsError(
				'not-found',
				'You may have deleted the synced playlist. Refresh to restore it.'
			)
		}

		try {
			return await update(spotify, docData.playlist_id)
		} catch (error) {
			let msg = 'Spotify Error'
			functions.logger.warn(error)
			if (typeof error == 'object' && error && 'statusCode' in error) {
				if ('message' in error && typeof error.message == 'string') msg = error.message
				throw new functions.https.HttpsError('unknown', msg, error)
			}
			throw error
		}
	})
interface Data {
	code: string
	origin: string
}

export const syncPublicLikedSongs = functions
	.runWith({ secrets })
	.pubsub.schedule('0 0 * * *')
	.onRun(async () => {
		const docRefs = await db.collection('public-liked-songs').listDocuments()
		return await Promise.all(
			docRefs.map(async ref => {
				const doc = await ref.get()
				const data = doc.data() as Document
				const spotify = new Spotify({
					clientId: process.env.SPOTIFY_CLIENT_ID,
					clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
					refreshToken: data.refresh_token
				})
				await spotify.refreshAccessToken()
				if (data.playlist_id) {
					const user = await spotify.getMe()
					if (!(await spotify.usersFollowPlaylist(data.playlist_id, [user.id]))[0])
						return await ref.delete()
					else return await update(spotify, data.playlist_id)
				} else return await ref.delete()
			})
		)
	})

async function update(spotify: Spotify, playlistId: string) {
	const [playlistTracks, savedTracks] = await Promise.all([
		spotify.getPlaylistTracks(playlistId),
		spotify.getMySavedTracks()
	])

	const removedTracks = playlistTracks.filter(
		item => item.track && !savedTracks.some(savedItem => savedItem.track.id === item.track!.id)
	)
	const addedTracks = savedTracks
		.filter(
			item => !playlistTracks.some(playlistItem => playlistItem.track?.id === item.track.id)
		)
		.reverse()

	if (removedTracks.length > 0)
		await forEvery(removedTracks, 100, items =>
			spotify.removeTracksToPlaylist(
				playlistId,
				items.map(i => i.track!.uri)
			)
		)
	if (addedTracks.length > 0)
		await forEvery(addedTracks, 100, items =>
			spotify.addTracksToPlaylist(
				playlistId,
				items.map(i => i.track.uri)
			)
		)

	await spotify.changePlaylistDetails(playlistId, { description: description() })

	return playlistId
}

function name(userName = 'User') {
	return userName + "'s Liked Songs"
}
function description() {
	const date = new Date().toLocaleDateString('en-US')
	return `Created at "https://spotify-tools/benkeys.com".\nLast updated on ${date}.`
}
