/** @jest-environment node */
import Spotify from 'src/spotify'

test(Spotify.prototype['requestAll'].name, async () => {
	type Spy = jest.SpiedFunction<Spotify['request']>
	const spy = jest.spyOn(Spotify.prototype, 'request' as any) as Spy
	const spotify = new Spotify({})
	const uris = Array.from(Array(53).keys()).map(n => n.toString())
	const tracks = uris.map(uri => ({ track: { uri } } as SpotifyApi.PlaylistTrackObject))
	spy.mockImplementationOnce(async () => {
		await new Promise(res => setTimeout(res, 200))
		return { items: tracks.slice(0, 50), total: 53 }
	}).mockImplementationOnce(async () => ({ items: tracks.slice(50) }))
	const res = await spotify.getPlaylistTracks('playlistId')
	expect(res).toStrictEqual(tracks)
})

afterAll(() => {
	jest.restoreAllMocks()
})
