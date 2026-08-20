import { request, getAll, forEvery } from './utils'

export function getMe(token: string) {
	return request<SpotifyApi.UserObjectPrivate>('me', 'GET', token)
}

export function getMyPlaylists(token: string) {
	return getAll<SpotifyApi.PlaylistObjectSimplified>('me/playlists', token)
}

type FilteredItem = Pick<
	SpotifyApi.TrackObjectFull,
	'id' | 'uri' | 'name' | 'is_local' | 'duration_ms' | 'type'
> & {
	album: Pick<SpotifyApi.TrackObjectFull['album'], 'id' | 'name' | 'images'>
	artists: Pick<SpotifyApi.TrackObjectFull['album']['artists'][number], 'id' | 'name'>[]
}
export type TrackObj = FilteredItem & { index: number }
export async function getPlaylistItems(token: string, playlistId: string) {
	const items = await getAll<{ item: FilteredItem | null }>(
		`playlists/${playlistId}/items`,
		token,
		{
			fields: 'total,items.item(album(id,name,artists,images),artists(id,name),id,uri,name,is_local,duration_ms,type)'
		}
	)
	return items
		.filter((item): item is { item: FilteredItem } => item.item?.type == 'track')
		.map<TrackObj>((item, index) => ({ index, ...item.item }))
}

export function removeItemsFromPlaylist(token: string, playlistId: string, uris: string[]) {
	return forEvery(uris, 100, uris =>
		request<SpotifyApi.PlaylistSnapshotResponse>(
			`playlists/${playlistId}/items`,
			'DELETE',
			token,
			{ uris }
		)
	)
}

export function addItemsToPlaylist(
	token: string,
	playlistId: string,
	uris: string[],
	position = 0
) {
	return forEvery(uris, 100, (uris, i) =>
		request<SpotifyApi.PlaylistSnapshotResponse>(
			`playlists/${playlistId}/items`,
			'POST',
			token,
			{ uris, position: position + i }
		)
	)
}
