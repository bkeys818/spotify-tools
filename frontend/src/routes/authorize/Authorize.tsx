import { getAllCookies, setTokenCookie } from '@/lib/cookie'
import { parseToken } from '@/lib/spotify/auth'
import { useError } from '@/lib/contexts/error'
import { useOneShotEffect } from '@/hooks/useOneShotEffect'

function getPath(params: URLSearchParams) {
	const { directed_from, state } = getAllCookies()
	if (!state || params.get('state') != state) throw new Error(`Not regonized (state)`)
	params.delete('state')
	if (!directed_from) throw new Error(`I'm lost! Where did you come from?`)
	return directed_from
}

/**
 * Shared OAuth trampoline. Renders nothing — it either forwards an
 * authorization `code` back to the originating route, or stashes an implicit
 * grant access token in a path-scoped cookie and redirects.
 */
export function Authorize() {
	const { setError } = useError()

	useOneShotEffect(() => {
		try {
			// code (response in query) - redirect with code in query
			const searchParams = new URLSearchParams(location.search)
			if (searchParams.has('state')) {
				const target = new URL(getPath(searchParams), location.origin)
				// forEach yields (value, key); the original had these inverted.
				searchParams.forEach((value, key) => target.searchParams.set(key, value))
				location.href = target.href
				// The original had no return here, so it fell through into the
				// token branch below and threw before the redirect could land.
				return
			}

			// access token (response in hash) - store token in cookie
			const hashParams = new URLSearchParams(location.hash.slice(1))
			const target = new URL(getPath(hashParams), location.origin)
			const { access_token, expires_in } = parseToken(hashParams)
			setTokenCookie(target.pathname, access_token, expires_in)
			location.replace(target.href)
		} catch (err) {
			setError(err)
		}
	})

	return null
}
