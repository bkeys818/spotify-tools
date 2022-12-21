import { handleResponse } from './global'
import SpotifyWebApi from 'spotify-web-api-node'
import { db } from './global'

export async function authorizeTool(tool: string, code: string, origin: string) {
	const spotify = new SpotifyWebApi({
		clientId: process.env.SPOTIFY_CLIENT_ID,
		clientSecret: process.env.SPOTIFY_CLIENT_SECRET
	})
	spotify.setRedirectURI(origin + '/authorize')
	const { refresh_token, access_token } = await handleResponse(() =>
		spotify.authorizationCodeGrant(code)
	)
	spotify.setAccessToken(access_token)
	const { id } = await handleResponse(() => spotify.getMe())
	const ref = db.doc(tool + '/' + id) as DocRef
	const doc = await ref.get()
	if (doc.exists) await ref.update({ refresh_token })
	else await ref.create({ refresh_token })
	return ref
}

type DocRef = FirebaseFirestore.DocumentReference<{ refresh_token: string }>
