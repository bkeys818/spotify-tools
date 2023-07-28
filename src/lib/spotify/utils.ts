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
		if (res.headers.get('content-type')?.startsWith('application/json')) return await res.json()
		else return true as T
	} else {
		let json: unknown
		try {
			json = await res.json()
		} catch {
			throw new Error(`${res.statusText} (${res.status})`)
		}
		if (isObj(json) && hasKeys(json, 'error')) {
			if (typeof json.error == 'string' && hasKeys(json, 'error_description'))
				throw new Error(`${json.error_description} (${json.error})`)
			else if (isObj(json.error) && hasKeys(json.error, 'status', 'message')) {
				throw new Error(`${json.error.message} (${json.error.status})`)
			}
		}
		throw new Error(JSON.stringify(json))
	}
}

type Primative = string | number | boolean | undefined

function isObj(value: unknown): value is object {
	return typeof value == 'object' && value !== null
}

function hasKeys<K extends string>(obj: object, ...keys: K[]): obj is object & Record<K, unknown> {
	for (const key of keys) if (!(key in obj)) return false
	return true
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
