import { handleResponse } from '../global'
import SpotifyWebApi from 'spotify-web-api-node'

export interface Data {
	refresh_token: string
	playlist_id?: string
}

export async function create(refresh_token: string) {
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

export async function update(refresh_token: string, playlist_id: string) {
	const spotify = await authorize(refresh_token)

	// TODO: remove playlist_id if doesn't work
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

	const updateMethods: Parameters<typeof handleResponse>[0][] = []
	if (removedTracks.length > 0)
		forEvery(removedTracks, 100, tracks => {
			updateMethods.push(() => spotify.removeTracksFromPlaylist(playlist_id, tracks))
		})
	if (addedTracks.length > 0)
		forEvery(addedTracks, 100, tracks => {
			updateMethods.push(() =>
				spotify.addTracksToPlaylist(
					playlist_id,
					tracks.map(track => track.uri)
				)
			)
		})

	await Promise.all(updateMethods.map(handleResponse))
	return playlist_id
}

function name(userName = 'User') {
	return userName + "'s Liked Songs"
}
function description() {
	const date = new Date().toLocaleDateString('en-US')
	return `Created at "benkeys.com/spotify/tools".\nLast updated on ${date}.`
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
	const items: SpotifyApi.PlaylistTrackObject[] = []
	let total = 1
	while (items.length < total) {
		const response = await handleResponse(() =>
			spotify.getPlaylistTracks(playlistId, {
				limit: 50,
				offset: items.length
			})
		)
		total = response.total
		items.push(...response.items)
	}
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

async function forEvery<T>(items: T[], limit: number, method: (items: T[]) => void) {
	for (let i = 0; i < items.length; i += limit) {
		method(items.slice(i, i + limit))
	}
}
