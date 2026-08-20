export async function forEvery<T>(
	items: T[],
	limit: number,
	method: (items: T[]) => Promise<unknown>
) {
	for (let i = 0; i < items.length; i += limit) {
		await method(items.slice(i, i + limit))
	}
}

/**
 * Runs `method` over `items` with at most `limit` in flight at once.
 * Results keep the order of `items`, not the order they finished in.
 */
export async function mapWithConcurrency<T, R>(
	items: T[],
	limit: number,
	method: (item: T, index: number) => Promise<R>
): Promise<R[]> {
	const results = new Array<R>(items.length)
	let cursor = 0
	const worker = async () => {
		while (cursor < items.length) {
			const index = cursor++
			results[index] = await method(items[index], index)
		}
	}
	await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
	return results
}

export function sleep(ms: number) {
	return new Promise<void>(resolve => setTimeout(resolve, ms))
}

export function formatError(err: unknown) {
	if (err instanceof Error) {
		return {
			msg: err.message,
			name: err.name,
			stack: err.stack,
			cause: err.cause
		}
	}
	if (typeof err == 'object') {
		return {
			json: JSON.stringify(err),
			obj: err
		}
	} else return err
}
