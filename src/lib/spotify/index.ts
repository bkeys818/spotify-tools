import { request, getAll, forEvery } from './utils'

export function getMe(token: string) {
	return request<SpotifyApi.UserObjectPrivate>('me', 'GET', token)
}

export function getMyPlaylists(token: string) {
	return getAll<SpotifyApi.PlaylistObjectSimplified>('me/playlists', token)
}

type FilteredTrack = Pick<
	SpotifyApi.TrackObjectFull,
	'id' | 'name' | 'is_local' | 'duration_ms' | 'type'
> & {
	album: Pick<SpotifyApi.TrackObjectFull['album'], 'id' | 'name' | 'images'>
	artists: Pick<SpotifyApi.TrackObjectFull['album']['artists'][number], 'id' | 'name'>[]
}
export type TrackObj = FilteredTrack & { index: number }
export async function getPlaylistTracks(token: string, playlistId: string) {
	const items = await getAll<{ track: FilteredTrack | null }>(
		`playlists/${playlistId}/tracks`,
		token,
		{
			fields: 'total,items.track(album(id,name,artists,images),artists(id,name),id,name,is_local,duration_ms,type)'
		}
	)
	return items
		.filter((item): item is { track: FilteredTrack } => item.track?.type == 'track')
		.map<TrackObj>((item, index) => ({ index, ...item.track }))
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
