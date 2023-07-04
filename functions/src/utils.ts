export async function forEvery<T>(
	items: T[],
	limit: number,
	method: (items: T[]) => Promise<unknown>
) {
	for (let i = 0; i < items.length; i += limit) {
		await method(items.slice(i, i + limit))
	}
}

export function isObjWith<K extends string>(value: unknown, ...keys: K[]): value is { [k in K]: any } {
	if (typeof value == 'object' && value) {
		for (const key of keys)
			if (!(key in value)) return false
		return true
	}
	return false;
}