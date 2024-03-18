export async function forEvery<T>(
	items: T[],
	limit: number,
	method: (items: T[]) => Promise<unknown>
) {
	for (let i = 0; i < items.length; i += limit) {
		await method(items.slice(i, i + limit))
	}
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
