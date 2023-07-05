export async function forEvery<T>(
	items: T[],
	limit: number,
	method: (items: T[]) => Promise<unknown>
) {
	for (let i = 0; i < items.length; i += limit) {
		await method(items.slice(i, i + limit))
	}
}
