import { redirect, type LoaderFunctionArgs } from 'react-router-dom'
import { getItem, removeItem, setToken } from '@/lib/storage'
import { authError, exchangeCode } from '@/lib/spotify/auth'

function getPath(params: URLSearchParams) {
	const directed_from = getItem('directed_from')
	const state = getItem('state')
	if (!state || params.get('state') != state) throw new Error(`Not regonized (state)`)
	params.delete('state')
	if (!directed_from) throw new Error(`I'm lost! Where did you come from?`)
	return directed_from
}

/**
 * Shared OAuth trampoline. Spotify always answers with a `code` in the query
 * now that the implicit grant is gone, so the stored `code_verifier` is what
 * tells the two flows apart: it is only ever set by a PKCE `authorize()` call.
 */
export async function loader({ request }: LoaderFunctionArgs) {
	const searchParams = new URL(request.url).searchParams
	const target = new URL(getPath(searchParams), location.origin)
	const code_verifier = getItem('code_verifier')

	// PKCE - redeem the code here and store the token in local storage,
	// because browser-only tools have no server to hold a refresh token for them.
	if (code_verifier) {
		removeItem('code_verifier')
		const error = searchParams.get('error')
		if (error) throw authError(error)
		const code = searchParams.get('code')
		if (!code) throw authError('No code found')
		const { access_token, expires_in } = await exchangeCode(code, code_verifier)
		setToken(access_token, expires_in)
		// `target.search` is whatever the originating route was carrying, which
		// `/duplicate-remover/playlist` needs to find its playlist again.
		return redirect(target.pathname + target.search)
	}

	// code - redirect with the code in the query, for the route to hand to a
	// callable function that exchanges it with the client secret.
	// forEach yields (value, key); the original had these inverted.
	searchParams.forEach((value, key) => target.searchParams.set(key, value))
	return redirect(target.pathname + target.search)
}
