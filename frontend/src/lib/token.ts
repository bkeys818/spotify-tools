import { getAllCookies } from './cookie'

/**
 * Reads the access token back out of the cookies written by `/authorize`,
 * returning null when there isn't a usable one.
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
 * For actions running underneath `SpotifyAuthLayout`, which only renders its
 * `<Outlet/>` when a token exists. An action only runs on a submission from an
 * already-rendered child, so a missing token here is a genuine invariant break
 * (expired since the layout loaded) and belongs on the route error element.
 *
 * Loaders cannot use this: they run in parallel with the layout's own loader,
 * so they execute even on the navigation where it decides to show the
 * Authorize button instead. They call `readToken()` and skip the fetch.
 */
export function requireToken() {
	const token = readToken()
	if (!token) throw new Error('Spotify authorization expired.')
	return token.accessToken
}
