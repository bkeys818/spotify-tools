import { readable, writable } from 'svelte/store'
import { auth } from './firebase/auth'
import { getAllCookies, setTokenCookie } from './cookie'
import type { AccessTokenResponse } from './spotify/auth'
import type { User } from 'firebase/auth'

export const user = readable<User | null | undefined>(undefined, set =>
	auth.onAuthStateChanged(set)
)

export const error = writable<unknown>(undefined)

export function createTokenStore(path: string) {
	const { set, subscribe } = writable<string | undefined | null>()

	function check() {
		const { access_token, auth_expiration } = getAllCookies()
		const expires_in = auth_expiration
			? parseInt(auth_expiration) - ((Date.now() / 1000) | 0)
			: undefined
		if (access_token && expires_in)
			handleSet({ access_token, expires_in } as AccessTokenResponse)
		else set(null)
	}

	function handleSet({ access_token, expires_in }: AccessTokenResponse) {
		setInterval(() => set(null), expires_in * 1000)
		setTokenCookie(path, access_token, expires_in)
		set(access_token)
	}

	return { subscribe, set: handleSet, check }
}
export type TokenStore = ReturnType<typeof createTokenStore>

export function sessioned<T>(
	key: string,
	value: T,
	encode: (value: T) => string,
	decode: (str: string) => T
) {
	const { set, subscribe, update } = writable(value)

	function check() {
		if (!document) throw new Error("Invalid environment: Can't reach document.")
		const storedValue = sessionStorage.getItem(key)
		if (storedValue) {
			set(decode(storedValue))
		} else {
			updateSession(value)
			set(value)
		}
	}

	return {
		subscribe,
		check,
		set: (value: T) => {
			updateSession(value)
			set(value)
		},
		update: (updater: (value: T) => T) => {
			updateSession(value)
			update(value => {
				const updated = updater(value)
				updateSession(updated)
				return updated
			})
		}
	}

	function updateSession(value: T) {
		if (value === undefined) sessionStorage.removeItem(key)
		else sessionStorage.setItem(key, encode(value))
	}
}
