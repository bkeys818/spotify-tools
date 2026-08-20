import { isRouteErrorResponse } from 'react-router-dom'
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
 * Normalises whatever reaches a route error element into something renderable.
 * Handles React Router's error responses, Firebase errors, plain Errors, and
 * bare objects thrown by the Spotify wrapper.
 */
export function describeError(err: unknown): ErrorDescription | null {
	if (err === undefined || err === null) return null
	if (typeof err === 'string') return { title: 'Error!', message: err }

	// Thrown `Response`s and router 404s arrive in this shape.
	if (isRouteErrorResponse(err)) {
		return {
			title: `${err.status} ${err.statusText}`,
			message: typeof err.data === 'string' ? err.data : undefined,
			details: typeof err.data === 'string' ? undefined : JSON.stringify(err.data)
		}
	}

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
