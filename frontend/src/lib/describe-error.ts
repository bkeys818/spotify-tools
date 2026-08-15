import type { FunctionsErrorCode } from 'firebase/functions'

export interface ErrorDescription {
	title: string
	message?: string
	details?: string
}

interface FirebaseError extends Error {
	name: 'FirebaseError'
	code: FunctionsErrorCode
	details: unknown
}

function isFirebaseError(error: object): error is FirebaseError {
	return 'name' in error && error.name === 'FirebaseError'
}

/**
 * Pure replacement for ErrorMsg's reactive block, which derived its output from
 * the error store while `delete`-ing keys off the very object it was reading.
 * It also tested the store itself rather than the store's value, so the
 * Firebase branch never actually ran.
 */
export function describeError(err: unknown): ErrorDescription | null {
	if (err === undefined || err === null) return null
	if (typeof err === 'string') return { title: 'Error!', message: err }
	// Strings are handled above, so anything left here is a non-object primitive.
	if (typeof err !== 'object')
		return {
			title: 'Unknown Error',
			message: String(err as number | boolean | bigint | symbol)
		}

	if (isFirebaseError(err)) {
		return {
			title: 'Firebase Error',
			message: `${err.message} (${err.code})`,
			details: err.details === undefined ? undefined : JSON.stringify(err.details)
		}
	}

	// Error's `message` is non-enumerable and `name` lives on the prototype, so
	// neither survives the object spread below. Handle real Errors up front.
	if (err instanceof Error) {
		return { title: err.name || 'Error!', message: err.message }
	}

	const rest = { ...err } as Record<string, unknown>
	let title = 'Error!'
	let message: string | undefined
	if (typeof rest.name === 'string') {
		title = rest.name
		delete rest.name
	}
	if (typeof rest.message === 'string') {
		message = rest.message
		delete rest.message
	}

	let details: string | undefined
	if ('details' in rest) details = JSON.stringify(rest.details)
	if (Object.keys(rest).length > 0) details = JSON.stringify(rest)

	return { title, message, details }
}
