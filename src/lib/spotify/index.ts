import { request, getAll, forEvery } from './utils'

export function getMe(token: string) {
	return request<SpotifyApi.UserObjectPrivate>('me', 'GET', token)
}

export function getMyPlaylists(token: string) {
	return getAll<SpotifyApi.PlaylistObjectSimplified>('me/playlists', token)
}

export function getPlaylistTracks(token: string, playlistId: string) {
	type SimplifiedPlaylistTrack = { track: { uri: string } | null }
	return getAll<SimplifiedPlaylistTrack>(`playlists/${playlistId}/tracks`, token, {
		fields: 'items.track.uri,total'
	})
}

export async function removeTracksToPlaylist(token: string, playlistId: string, uris: string[]) {
	return forEvery(uris, 100, uris =>
		request<SpotifyApi.PlaylistSnapshotResponse>(
			`playlists/${playlistId}/tracks`,
			'DELETE',
			token,
			{ uris }
		)
	)
}
