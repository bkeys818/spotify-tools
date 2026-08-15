import { useEffect, useState, type DependencyList } from 'react'

export type PromiseState<T> =
	| { status: 'pending'; data?: undefined; error?: undefined }
	| { status: 'fulfilled'; data: T; error?: undefined }
	| { status: 'rejected'; data?: undefined; error: unknown }

function sameDeps(a: DependencyList, b: DependencyList) {
	return a.length === b.length && a.every((value, i) => Object.is(value, b[i]))
}

/**
 * The `{#await}` replacement. Pass null to stay pending, which covers the
 * cases where Svelte simply hadn't started the promise yet.
 */
export function usePromise<T>(
	fn: (() => Promise<T>) | null,
	deps: DependencyList
): PromiseState<T> {
	const [state, setState] = useState<PromiseState<T>>({ status: 'pending' })
	const [prevDeps, setPrevDeps] = useState(deps)

	// Reset during render rather than inside the effect: setting state
	// synchronously in an effect would schedule an extra render pass.
	if (!sameDeps(prevDeps, deps)) {
		setPrevDeps(deps)
		setState({ status: 'pending' })
	}

	useEffect(() => {
		if (!fn) return
		let cancelled = false
		fn().then(
			data => {
				if (!cancelled) setState({ status: 'fulfilled', data })
			},
			(error: unknown) => {
				if (!cancelled) setState({ status: 'rejected', error })
			}
		)
		return () => {
			cancelled = true
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps)

	return state
}
