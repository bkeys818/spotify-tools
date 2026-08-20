import type { Response } from 'node-fetch'

/**
 * Carries the HTTP status alongside the message so callers can branch on it.
 * `message` keeps the exact format the plain `Error` used to produce, because
 * the tools match on it (e.g. `invalid_grant`, `Refresh token revoked`).
 */
export class SpotifyError extends Error {
	readonly status: number
	/** `Retry-After` in seconds, when the response carried one. */
	readonly retryAfter: number | undefined

	constructor(message: string, status: number, retryAfter?: number) {
		super(message)
		this.name = 'SpotifyError'
		this.status = status
		this.retryAfter = retryAfter
	}
}

export const handleError = async (res: Response): Promise<SpotifyError> => {
	// Read headers before the body — a body can only be consumed once.
	const retryAfter = parseRetryAfter(res.headers.get('retry-after'))
	const error = (message: string) => new SpotifyError(message, res.status, retryAfter)
	let json: unknown
	try {
		json = await res.json()
	} catch {
		return error(`${res.statusText} (${res.status})`)
	}
	if (isObj(json) && 'error' in json) {
		if (typeof json.error == 'string' && 'error_description' in json)
			return error(`${json.error_description as string} (${json.error})`)
		else if (isObj(json.error) && 'status' in json.error && 'message' in json.error) {
			return error(`${json.error.message as string} (${json.error.status as string})`)
		}
	}
	return error(JSON.stringify(json))
}

export function parseRetryAfter(value: string | null) {
	if (!value) return undefined
	const seconds = Number(value)
	return Number.isFinite(seconds) && seconds > 0 ? seconds : undefined
}

function isObj(value: unknown): value is object {
	return typeof value == 'object' && value !== null
}
