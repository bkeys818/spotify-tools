import { redirect, type LoaderFunctionArgs } from 'react-router-dom'
import { getAllCookies, setTokenCookie } from '@/lib/cookie'
import { parseToken } from '@/lib/spotify/auth'

function getPath(params: URLSearchParams) {
	const { directed_from, state } = getAllCookies()
	if (!state || params.get('state') != state) throw new Error(`Not regonized (state)`)
	params.delete('state')
	if (!directed_from) throw new Error(`I'm lost! Where did you come from?`)
	return directed_from
}

/**
 * Shared OAuth trampoline. Pure navigation, so it is a loader with no element:
 * it either forwards an authorization `code` back to the originating route, or
 * stashes an implicit-grant access token in a path-scoped cookie first.
 */
export function loader({ request }: LoaderFunctionArgs) {
	// code (response in query) - redirect with code in query
	const searchParams = new URL(request.url).searchParams
	if (searchParams.has('state')) {
		const target = new URL(getPath(searchParams), location.origin)
		// forEach yields (value, key); the original had these inverted.
		searchParams.forEach((value, key) => target.searchParams.set(key, value))
		// The original had no return here, so it fell through into the token
		// branch below and threw before the redirect could land.
		return redirect(target.pathname + target.search)
	}

	// access token (response in hash) - store token in cookie.
	// The hash is not part of `request.url`, so it has to come off `location`.
	const hashParams = new URLSearchParams(location.hash.slice(1))
	const target = new URL(getPath(hashParams), location.origin)
	const { access_token, expires_in } = parseToken(hashParams)
	setTokenCookie(target.pathname, access_token, expires_in)
	return redirect(target.pathname + target.search)
}
