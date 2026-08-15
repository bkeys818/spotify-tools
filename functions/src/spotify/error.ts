import type { Response } from 'node-fetch'

export const handleError = async (res: Response): Promise<Error> => {
	let json: unknown
	try {
		json = await res.json()
	} catch {
		return new Error(`${res.statusText} (${res.status})`)
	}
	if (isObj(json) && 'error' in json) {
		if (typeof json.error == 'string' && 'error_description' in json)
			return new Error(`${json.error_description as string} (${json.error})`)
		else if (isObj(json.error) && 'status' in json.error && 'message' in json.error) {
			return new Error(`${json.error.message as string} (${json.error.status as string})`)
		}
	}
	return new Error(JSON.stringify(json))
}

function isObj(value: unknown): value is object {
	return typeof value == 'object' && value !== null
}
