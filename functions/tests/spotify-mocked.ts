import Spotify from 'src/spotify'

type PublicSpotify = { [T in keyof Spotify]: Spotify[T] }

const track = { uri: 'spotify:track:trackId' }
const playlist = { name: 'playlist', id: 'playlistId' }
const playlistSnapshot = { snapshot_id: 'snapshotId' }

export const mockedSpotify: jest.Mocked<PublicSpotify> = {
	setRefreshToken: jest.fn(),
	authorizationCodeGrant: jest.fn().mockImplementation(() => ({ refresh_token: 'refreshToken' })),
	refreshAccessToken: jest.fn().mockImplementation(() => {}),
	getMe: jest.fn().mockImplementation(() => ({ id: 'userId', display_name: 'user' })),
	getMySavedTracks: jest.fn().mockImplementation(() => [{ track }]),
	getMyPlaylists: jest.fn().mockImplementation(() => [playlist]),
	createPlaylist: jest.fn().mockImplementation(() => ({ id: 'playlistId' })),
	changePlaylistDetails: jest.fn().mockImplementation(() => {}),
	getPlaylistTracks: jest.fn().mockImplementation(() => [{ track }]),
	addTracksToPlaylist: jest.fn().mockImplementation(() => playlistSnapshot),
	removeTracksToPlaylist: jest.fn().mockImplementation(() => playlistSnapshot),
	usersFollowPlaylist: jest.fn().mockImplementation(() => [true])
}

jest.mock('src/spotify', () => jest.fn().mockImplementation(() => mockedSpotify))
