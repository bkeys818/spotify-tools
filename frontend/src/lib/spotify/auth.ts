import { setCookie } from '@/lib/cookie'

const PUBLIC_CLIENT_ID = import.meta.env.PUBLIC_CLIENT_ID

const redirectUri = () => location.origin + '/authorize'

/**
 * Sends the browser to Spotify's consent screen.
 *
 * Both types are the authorization-code flow — Spotify retired the implicit
 * grant, and `response_type=token` now fails with "response_type must be code".
 * They differ in who redeems the code afterwards: `code` hands it back to the
 * originating route (which trades it for a refresh token through a callable
 * function, using the client secret), while `pkce` keeps the exchange in the
 * browser, proving possession with a `code_verifier` instead of a secret.
 */
export async function authorize(type: 'code' | 'pkce', scopes?: string) {
	const state = createState()
	setCookie('state', state)
	const params = new URLSearchParams({
		response_type: 'code',
		client_id: PUBLIC_CLIENT_ID,
		redirect_uri: redirectUri(),
		state
	})
	if (scopes) params.set('scope', scopes)
	if (type == 'pkce') {
		const verifier = createState(64)
		setCookie('code_verifier', verifier)
		params.set('code_challenge_method', 'S256')
		params.set('code_challenge', await createChallenge(verifier))
	}
	location.href = 'https://accounts.spotify.com/authorize?' + params.toString()
}

export interface AccessTokenResponse {
	readonly access_token: string
	readonly token_type: 'Bearer'
	readonly expires_in: number
}

/**
 * Redeems an authorization code in the browser. Only valid for codes obtained
 * with a `code_challenge`, since there is no client secret to send.
 */
export async function exchangeCode(code: string, codeVerifier: string) {
	const res = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			code,
			redirect_uri: redirectUri(),
			client_id: PUBLIC_CLIENT_ID,
			code_verifier: codeVerifier
		})
	})
	const body = (await res.json()) as Partial<
		AccessTokenResponse & { error: string; error_description: string }
	>
	if (!res.ok) throw authError(body.error_description ?? body.error ?? `${res.status}`)
	const { access_token, token_type, expires_in } = body
	if (!access_token || !expires_in) throw authError('No token found')
	return { access_token, token_type, expires_in } as AccessTokenResponse
}

const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-._~'.split('')

/** Also the `code_verifier`, hence the 64 characters — PKCE requires 43 to 128. */
function createState(length = 18) {
	const bytes = crypto.getRandomValues(new Uint8Array(length))
	let str = ''
	for (const byte of bytes) str += chars[byte % chars.length]
	return str
}

async function createChallenge(verifier: string) {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
	const binary = String.fromCharCode(...new Uint8Array(digest))
	// base64url, which is what Spotify compares the challenge against.
	return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '')
}

export const authError = (msg: string) => new Error(`Spotify authorization failed (${msg})`)
