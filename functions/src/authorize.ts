import { handleResponse } from './utils'
import SpotifyWebApi from 'spotify-web-api-node'

export async function getRefreshToken(code: string, origin: string) {
	const spotify = new SpotifyWebApi({
		clientId: process.env.SPOTIFY_CLIENT_ID,
		clientSecret: process.env.SPOTIFY_CLIENT_SECRET
	})
	spotify.setRedirectURI(origin + '/authorize')
	const { refresh_token, access_token } = await handleResponse(() => spotify.authorizationCodeGrant(code))
	spotify.setAccessToken(access_token)
	const { id } = await handleResponse(() => spotify.getMe())
	return { refresh_token, user_id: id }
}
