import type { Response } from 'node-fetch'

export const handleRepsonse = async <T>(method: () => Promise<Response>): Promise<T> => {
	const res = await method()
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

function isObj(value: unknown): value is object {
	return typeof value == 'object' && value !== null
}

function hasKeys<K extends string>(obj: object, ...keys: K[]): obj is object & Record<K, unknown> {
	for (const key of keys) if (!(key in obj)) return false
	return true
}
