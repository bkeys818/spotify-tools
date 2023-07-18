import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { warn } from 'firebase-functions/logger'
import { db } from '../init'
import Spotify from '../spotify'
import { forEvery } from '../utils'
import { secrets } from '../env'

interface Document {
	refresh_token: string
	playlist_id?: string
}

export const create = onCall<Data>({ secrets }, async ({ data, auth }) => {
	if (!auth) throw new HttpsError('unauthenticated', 'User must be authenticated.')

	const spotify = new Spotify({
		clientId: process.env.SPOTIFY_CLIENT_ID,
		clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
		redirectUri: data.origin + '/authorize'
	})
	const { refresh_token } = await spotify.authorizationCodeGrant(data.code).catch(err => {
		if (err == 'invalid_grant')
			throw new HttpsError('unauthenticated', 'Spotify authorization denied')
		throw err
	})
	const user = await spotify.getMe()

	const ref = db.collection('public-liked-songs').doc(user.id)
	let doc = await ref.get()

	let docData: Document
	if (doc.exists) {
		docData = doc.data() as Document
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
		throw new HttpsError(
			'not-found',
			'You may have deleted the synced playlist. Refresh to restore it.'
		)
	}

	try {
		return await update(spotify, docData.playlist_id)
	} catch (error) {
		let msg = 'Spotify Error'
		warn(error)
		if (typeof error == 'object' && error && 'statusCode' in error) {
			if ('message' in error && typeof error.message == 'string') msg = error.message
			throw new HttpsError('unknown', msg, error)
		}
		throw error
	}
})

interface Data {
	code: string
	origin: string
}

export const sync = onSchedule({ schedule: '0 0 * * *', secrets }, async () => {
	const docRefs = await db.collection('public-liked-songs').listDocuments()
	await Promise.all(
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
	return
})

async function update(spotify: Spotify, playlistId: string) {
	const [playlistTracks, savedTracks] = await Promise.all([
		spotify.getPlaylistTracks(playlistId),
		spotify.getMySavedTracks()
	])
	const playlistTrackUris = playlistTracks
		.map(item => item.track?.uri)
		.filter((v): v is string => v !== undefined)
	const savedTrackUris = savedTracks.map(item => item.track.uri)

	const removedTrackIds = playlistTrackUris.filter(id => !savedTrackUris.includes(id))
	const addedTrackIds = savedTrackUris.filter(id => !playlistTrackUris.includes(id)).reverse()

	if (removedTrackIds.length > 0)
		await forEvery(removedTrackIds, 100, ids => spotify.removeTracksToPlaylist(playlistId, ids))
	if (addedTrackIds.length > 0)
		await forEvery(addedTrackIds, 100, ids => spotify.addTracksToPlaylist(playlistId, ids))

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
