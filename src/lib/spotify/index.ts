import { PUBLIC_CLIENT_ID } from '$env/static/public'
import { setCookie } from '$lib/cookie'

export function authorize(type: 'code' | 'token', scopes?: string) {
	const state = createState()
	setCookie('state', state)
	const params = new URLSearchParams({
		response_type: type,
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

export function parseCode() {
	const params = new URLSearchParams(location.search.slice(1))
	history.replaceState({}, document.title, location.pathname)
	if (params.has('error')) throw authError(params.get('error')!)
	return params.get('code')
}

export function parseToken(): AccessTokenResponse | undefined {
	const params = new URLSearchParams(location.search.slice(1))
	history.replaceState({}, document.title, location.pathname)
	if (params.has('error')) throw authError(params.get('error')!)
	const access_token = params.get('access_token')
	const token_type = params.get('token_type') as 'Bearer'
	const expires_in = params.get('expires_in')
	if (access_token && expires_in)
	return { access_token, token_type, expires_in: parseInt(expires_in) }
}

const authError = (msg: string) => new Error(`Spotify authorization failed (${msg})`)
