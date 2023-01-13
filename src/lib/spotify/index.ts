import { PUBLIC_CLIENT_ID } from '$env/static/public'
import { setCookie } from '$lib/cookie'

export function authorize(scopes?: string) {
	const state = createState()
	setCookie('state', state)
	const params = new URLSearchParams({
		response_type: 'code',
		client_id: PUBLIC_CLIENT_ID,
		redirect_uri: location.origin + '/authorize',
		state
	})
	if (scopes) params.set('scope', scopes)
	location.href = 'https://accounts.spotify.com/authorize?' + params.toString()
}

export interface AccessTokenResponse {
	readonly access_token: string
	readonly token_type: 'Bearer'
	readonly expires_in: number
}

function createState(length = 18) {
	const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~'.split('')
	let str = ''
	for (let i = 0; i < length; i++) str += chars[Math.floor(Math.random() * chars.length)]
	return str
}
