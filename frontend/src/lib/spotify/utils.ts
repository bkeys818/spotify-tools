export async function getAll<T>(
	endpoint: string,
	token: string,
	params?: Record<string, Primative>
): Promise<T[]> {
	const limit = 50
	const { items, total } = await request<SpotifyApi.PagingObject<T>>(endpoint, 'GET', token, {
		limit,
		fields: 'items,total',
		...params
	})
	const reqN = [...Array(Math.ceil(total / limit)).keys()] // number of request that need to be run
	reqN.shift() // first request has already been run
	const responses = await Promise.all(
		reqN.map(i =>
			request<SpotifyApi.PagingObject<T>>(endpoint, 'GET', token, {
				limit,
				offset: limit * i,
				fields: 'items',
				...params
			})
		)
	)
	items.push(...responses.flatMap(res => res.items))
	return items
}

export async function request<T>(
	endpoint: string,
	method: 'GET',
	token: string,
	params?: Record<string, Primative>
): Promise<T>
export async function request<T>(
	endpoint: string,
	method: 'POST' | 'PUT' | 'DELETE',
	token: string,
	params?: Record<string, Primative | Primative[]>
): Promise<T>
export async function request<T>(
	endpoint: string,
	method: 'GET' | 'POST' | 'PUT' | 'DELETE',
	token: string,
	params?: Record<string, Primative | Primative[]>
): Promise<T> {
	let url = 'https://api.spotify.com/v1/' + endpoint
	let body: BodyInit | undefined
	if (method == 'GET' && params) {
		for (const key in params) if (params[key]) params[key] = params[key]?.toString()
		url += '?' + new URLSearchParams(params as Record<string, string>).toString()
	} else if (params) {
		body = JSON.stringify(params)
	}
	const res = await fetch(url, {
		headers: { Authorization: 'Bearer ' + token },
		method,
		body
	})
	if (res.status < 300) {
		if (res.headers.get('content-type')?.startsWith('application/json'))
			return (await res.json()) as T
		else return true as T
	} else {
		let json: unknown
		try {
			json = await res.json()
		} catch {
			throw new Error(`${res.statusText} (${res.status})`)
		}
		if (isObj(json) && 'error' in json) {
			if (typeof json.error == 'string' && 'error_description' in json)
				throw new Error(`${json.error_description as string} (${json.error})`)
			else if (isObj(json.error) && 'status' in json.error && 'message' in json.error) {
				throw new Error(`${json.error.message as string} (${json.error.status as string})`)
			}
		}
		throw new Error(JSON.stringify(json))
	}
}

type Primative = string | number | boolean | undefined

function isObj(value: unknown): value is object {
	return typeof value == 'object' && value !== null
}

export async function forEvery<T, R>(
	items: T[],
	limit: number,
	method: (items: T[], index: number) => Promise<R>
) {
	const responses: R[] = []
	for (let i = 0; i < items.length; i += limit) {
		responses.push(await method(items.slice(i, i + limit), i))
	}
	return responses
}
