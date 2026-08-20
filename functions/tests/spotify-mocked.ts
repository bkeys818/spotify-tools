import Spotify from 'src/spotify'

type PublicSpotify = { [T in keyof Spotify]: Spotify[T] }

const ms: jest.Mocked<PublicSpotify> = {
	setRefreshToken: jest.fn(),
	authorizationCodeGrant: jest.fn(),
	refreshAccessToken: jest.fn(),
	getMe: jest.fn(),
	getMySavedTracks: jest.fn(),
	getMyPlaylists: jest.fn(),
	createPlaylist: jest.fn(),
	changePlaylistDetails: jest.fn(),
	getPlaylistItems: jest.fn(),
	addItemsToPlaylist: jest.fn(),
	removeItemsToPlaylist: jest.fn(),
	usersFollowPlaylist: jest.fn()
}

export default ms

jest.mock('src/spotify', () => jest.fn().mockImplementation(() => ms))

ms.setRefreshToken.mockImplementation(() => {
	// do nothing
})

ms.authorizationCodeGrant.mockImplementation(() =>
	Promise.resolve({ refresh_token: 'refreshToken' } as Awaited<
		ReturnType<Spotify['authorizationCodeGrant']>
	>)
)

ms.refreshAccessToken.mockImplementation(() => Promise.resolve())

const user = { id: 'userId', display_name: 'user' } as SpotifyApi.UserObjectPrivate

ms.getMe.mockResolvedValue(user)

const track = { uri: 'spotify:track:trackId' } as SpotifyApi.TrackObjectFull
const savedTrack = { track } as SpotifyApi.SavedTrackObject

ms.getMySavedTracks.mockResolvedValue([savedTrack])

const playlist = { name: 'playlist', id: 'playlistId' } as SpotifyApi.PlaylistObjectSimplified

ms.getMyPlaylists.mockResolvedValue([playlist])

const fullPlaylist = playlist as SpotifyApi.PlaylistObjectFull

ms.createPlaylist.mockResolvedValue(fullPlaylist)

ms.changePlaylistDetails.mockImplementation(() => Promise.resolve())

ms.getPlaylistItems.mockResolvedValue([{ item: track }])

const playlistSnapshot: SpotifyApi.PlaylistSnapshotResponse = { snapshot_id: 'snapshotId' }

ms.addItemsToPlaylist.mockResolvedValue(playlistSnapshot)

ms.removeItemsToPlaylist.mockResolvedValue(playlistSnapshot)

ms.usersFollowPlaylist.mockResolvedValue([true])
