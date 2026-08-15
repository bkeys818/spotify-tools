import { getAllCookies, setTokenCookie } from './cookie'

/**
 * Framework-free half of what used to live in `createTokenStore`. Reads the
 * implicit-grant access token back out of the path-scoped cookies written by
 * `/authorize`, returning null when there isn't a usable one.
 */
export function readToken() {
	const { access_token, auth_expiration } = getAllCookies()
	if (!access_token || !auth_expiration) return null
	const expiresIn = parseInt(auth_expiration) - ((Date.now() / 1000) | 0)
	// The Svelte version tested `if (access_token && expires_in)`, which is
	// truthy for an already-expired (negative) token.
	if (!Number.isFinite(expiresIn) || expiresIn <= 0) return null
	return { accessToken: access_token, expiresIn }
}

export function writeToken(path: string, accessToken: string, expiresIn: number) {
	setTokenCookie(path, accessToken, expiresIn)
}
