import * as functions from 'firebase-functions'
import { getRefreshToken } from '../authorize'
import { db } from '../firestore'
import { handleResponse, forEvery } from '../utils'
import SpotifyWebApi from 'spotify-web-api-node'

interface Document {
	refresh_token: string
	playlist_id?: string
}

export const createPublicLikedSongs = functions
	.runWith({ secrets: ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'] })
	.https.onCall(async (data: Data, context) => {
		if (!context.auth)
			throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.')
		const refresh_token = await getRefreshToken(data.code, data.origin)
		const ref = db.collection('public-liked-songs').doc(context.auth.uid)
		let doc = await ref.get()
		if (doc.exists) await ref.update({ refresh_token })
		else await ref.create({ refresh_token })

		doc = await ref.get()
		const docData = doc.data() as Document
		if (!docData.playlist_id) {
			docData.playlist_id = await create(docData.refresh_token)
			await ref.update({ playlist_id: docData.playlist_id })
		}
		try {
			return await update(docData.refresh_token, docData.playlist_id)
		} catch (error) {
			if (typeof error == 'object' && error && 'statusCode' in error)
				if ((error as { statusCode: unknown }).statusCode == 404)
					return await ref.update({ playlist_id: undefined })
			throw error
		}
	})
interface Data {
	code: string
	origin: string
}

export const syncPublicLikedSongs = functions
	.runWith({ secrets: ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'] })
	.pubsub.schedule('0 0 * * *')
	.onRun(async () => {
		const docRefs = await db.collection('public-liked-songs').listDocuments()
		return await Promise.all(
			docRefs.map(async ref => {
				const doc = await ref.get()
				const data = doc.data() as Document
				if (data.playlist_id) return await update(data.refresh_token, data.playlist_id)
				else return
			})
		)
	})

async function create(refresh_token: string) {
	const spotify = await authorize(refresh_token)
	const [playlists, user] = await Promise.all([
		getAllPlaylist(spotify),
		handleResponse(() => spotify.getMe())
	])
	const playlistName = name(user.display_name)
	for (const playlist of playlists) {
		if (playlist.name == playlistName) return playlist.id
	}
	// if playlist doesn't exist
	const playlist = await handleResponse(() =>
		spotify.createPlaylist(playlistName, {
			description: description(),
			public: true
		})
	)
	return playlist.id
}

async function update(refresh_token: string, playlist_id: string) {
	const spotify = await authorize(refresh_token)

	const [playlistTracks, savedTracks] = await Promise.all([
		getPlaylistTracks(spotify, playlist_id),
		getSavedTracks(spotify)
	])

	const removedTracks = playlistTracks.filter(
		track => !savedTracks.some(savedTrack => savedTrack.id === track.id)
	)
	const addedTracks = savedTracks.filter(
		track => !playlistTracks.some(playlistTrack => playlistTrack.id === track.id)
	)

	if (removedTracks.length > 0)
		await forEvery(removedTracks, 100, tracks =>
			spotify.removeTracksFromPlaylist(playlist_id, tracks)
		)
	if (addedTracks.length > 0)
		await forEvery(addedTracks, 100, tracks =>
			spotify.addTracksToPlaylist(
				playlist_id,
				tracks.map(track => track.uri)
			)
		)

	await handleResponse(() =>
		spotify.changePlaylistDetails(playlist_id, { description: description() })
	)
	return playlist_id
}

function name(userName = 'User') {
	return userName + "'s Liked Songs"
}
function description() {
	const date = new Date().toLocaleDateString('en-US')
	return `Created at "https://spotify-tools/benkeys.com".\nLast updated on ${date}.`
}

/** This function must be run somewhere with access to `SPOTIFY_CLIENT_ID` & `SPOTIFY_CLIENT_SECRET`. */
async function authorize(refresh_token: string) {
	const spotify = new SpotifyWebApi({
		clientId: process.env.SPOTIFY_CLIENT_ID,
		clientSecret: process.env.SPOTIFY_CLIENT_SECRET
	})
	spotify.setRefreshToken(refresh_token)
	const { access_token } = await handleResponse(() => spotify.refreshAccessToken())
	spotify.setAccessToken(access_token)
	return spotify
}

async function getPlaylistTracks(spotify: SpotifyWebApi, playlistId: string) {
	const limit = 50
	const { items, total } = await handleResponse(() =>
		spotify.getPlaylistTracks(playlistId, { limit })
	)
	const reqN = [...Array(Math.ceil(total / limit)).keys()] // number of request that need to be run
	reqN.shift() // first request has already been run
	const responses = await Promise.all(
		reqN.map(i =>
			handleResponse(() =>
				spotify.getPlaylistTracks(playlistId, { limit, offset: limit * i })
			)
		)
	)
	items.push(...responses.flatMap(res => res.items))
	return items
		.map(item => item.track)
		.filter((item): item is SpotifyApi.TrackObjectFull => Boolean(item))
}

async function getSavedTracks(spotify: SpotifyWebApi) {
	const limit = 50
	const { items, total } = await handleResponse(() => spotify.getMySavedTracks({ limit }))
	const reqN = [...Array(Math.ceil(total / limit)).keys()] // number of request that need to be run
	reqN.shift() // first request has already been run
	const responses = await Promise.all(
		reqN.map(i => handleResponse(() => spotify.getMySavedTracks({ limit, offset: limit * i })))
	)
	items.push(...responses.flatMap(res => res.items))
	return items.map(item => item.track)
}

async function getAllPlaylist(spotify: SpotifyWebApi) {
	const limit = 50
	const { items, total } = await handleResponse(() => spotify.getUserPlaylists({ limit }))
	const reqN = [...Array(Math.ceil(total / limit)).keys()] // number of request that need to be run
	reqN.shift() // first request has already been run
	const responses = await Promise.all(
		reqN.map(i => handleResponse(() => spotify.getUserPlaylists({ limit, offset: limit * i })))
	)
	items.push(...responses.flatMap(res => res.items))
	return items
}
