import { getAllCookies } from './cookie'

/**
 * Reads the implicit-grant access token back out of the path-scoped cookies
 * written by `/authorize`, returning null when there isn't a usable one.
 *
 * Synchronous, which is what lets route loaders call it directly.
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

/**
 * For loaders and actions running underneath `SpotifyAuthLayout`, which only
 * renders its `<Outlet/>` when a token exists. Throwing here is a genuine
 * invariant break (expired between the layout loader and this one), so it
 * surfaces on the route error element.
 */
export function requireToken() {
	const token = readToken()
	if (!token) throw new Error('Spotify authorization expired. Reload to sign in again.')
	return token.accessToken
}
