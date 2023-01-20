export function handleResponse<T>(call: () => Promise<Response<T>>): Promise<T> {
	return call()
		.catch(error => {
			throw `Spotify Error: ${error}`
		})
		.then(res => {
			if (res.statusCode < 300) {
				return res.body
			} else {
				// handle error
				throw `Spotify Error: ${res.statusCode}`
			}
		})
}
interface Response<T> {
	body: T
	headers: Record<string, string>
	statusCode: number
}

export async function forEvery<T>(
	items: T[],
	limit: number,
	method: (items: T[]) => Promise<unknown>
) {
	for (let i = 0; i < items.length; i += limit) {
		await method(items.slice(i, i + limit))
	}
}
