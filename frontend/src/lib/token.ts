import { getToken } from './storage'

/**
 * Reads the access token back out of the local storage written by `/authorize`,
 * returning null when there isn't a usable one.
 *
 * Synchronous, which is what lets route loaders call it directly.
 */
export function readToken() {
	return getToken() ?? null
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
