import { useEffect, useState } from 'react'
import { readToken, writeToken } from '@/lib/token'

/**
 * Replaces `createTokenStore(path)`. Deliberately a hook and not a context:
 * the Svelte version was instantiated per `<AuthSpotify>` instance, so the
 * token is scoped to that subtree rather than being global state.
 *
 * The store had a third `undefined` state meaning "not checked yet", because
 * SvelteKit prerendered and could only read cookies in onMount. There is no
 * SSR here, so the cookie is read during the first render instead and that
 * state is unreachable.
 */
export function useSpotifyToken(path: string) {
	const [token, setToken] = useState<string | null>(() => readToken()?.accessToken ?? null)

	useEffect(() => {
		const stored = readToken()
		if (!stored) return
		// Re-write the cookie so its path scope and lifetime track this route.
		writeToken(path, stored.accessToken, stored.expiresIn)
		// Was `setInterval`, never cleared, so it leaked a timer per mount.
		const timer = setTimeout(() => setToken(null), stored.expiresIn * 1000)
		return () => clearTimeout(timer)
	}, [path])

	return token
}
