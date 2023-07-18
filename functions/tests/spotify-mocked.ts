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
	getPlaylistTracks: jest.fn(),
	addTracksToPlaylist: jest.fn(),
	removeTracksToPlaylist: jest.fn(),
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

ms.getMe.mockImplementation(async () => user)

const track = { uri: 'spotify:track:trackId' } as SpotifyApi.TrackObjectFull
const savedTrack = { track } as SpotifyApi.SavedTrackObject

ms.getMySavedTracks.mockImplementation(async () => [savedTrack])

const playlist = { name: 'playlist', id: 'playlistId' } as SpotifyApi.PlaylistObjectSimplified

ms.getMyPlaylists.mockImplementation(async () => [playlist])

const fullPlaylist = playlist as SpotifyApi.PlaylistObjectFull

ms.createPlaylist.mockImplementation(async () => fullPlaylist)

ms.changePlaylistDetails.mockImplementation(() => Promise.resolve())

const playlistTracks = savedTrack as SpotifyApi.PlaylistTrackObject

ms.getPlaylistTracks.mockImplementation(async () => [playlistTracks])

const playlistSnapshot: SpotifyApi.PlaylistSnapshotResponse = { snapshot_id: 'snapshotId' }

ms.addTracksToPlaylist.mockImplementation(async () => playlistSnapshot)

ms.removeTracksToPlaylist.mockImplementation(async () => playlistSnapshot)

ms.usersFollowPlaylist.mockImplementation(async () => [true])
