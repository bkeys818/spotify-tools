import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

/** Replaces the global `error` writable store. Written from anywhere, read by `ErrorMsg`. */
interface ErrorContextValue {
	error: unknown
	setError: (error: unknown) => void
}

const ErrorContext = createContext<ErrorContextValue>({
	error: undefined,
	setError: () => undefined
})

export function ErrorProvider({ children }: { children: ReactNode }) {
	const [error, setError] = useState<unknown>(undefined)
	const value = useMemo(() => ({ error, setError }), [error])

	return <ErrorContext value={value}>{children}</ErrorContext>
}

export function useError() {
	return useContext(ErrorContext)
}
