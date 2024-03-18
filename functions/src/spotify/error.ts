import type { Response } from 'node-fetch'

export const handleError = async (res: Response): Promise<Error> => {
	let json: unknown
	try {
		json = await res.json()
	} catch {
		return new Error(`${res.statusText} (${res.status})`)
	}
	if (isObj(json) && hasKeys(json, 'error')) {
		if (typeof json.error == 'string' && hasKeys(json, 'error_description'))
			return new Error(`${json.error_description} (${json.error})`)
		else if (isObj(json.error) && hasKeys(json.error, 'status', 'message')) {
			return new Error(`${json.error.message} (${json.error.status})`)
		}
	}
	return new Error(JSON.stringify(json))
}

function isObj(value: unknown): value is object {
	return typeof value == 'object' && value !== null
}

function hasKeys<K extends string>(obj: object, ...keys: K[]): obj is object & Record<K, unknown> {
	for (const key of keys) if (!(key in obj)) return false
	return true
}
