import { useEffect, useRef } from 'react'

/**
 * Runs an effect exactly once per mount, surviving StrictMode's deliberate
 * double-invocation in dev.
 *
 * Needed because `parseCode()` and the /authorize trampoline are not
 * idempotent — both call `history.replaceState` to strip the query string, so
 * a second invocation sees an empty URL and silently does nothing. Svelte's
 * `onMount` ran once, so a plain useEffect would diverge in dev only.
 */
export function useOneShotEffect(effect: () => void) {
	const hasRun = useRef(false)

	useEffect(() => {
		if (hasRun.current) return
		hasRun.current = true
		effect()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])
}
