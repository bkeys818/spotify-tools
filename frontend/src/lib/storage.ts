/**
 * Local storage has no expiry of its own, so each entry carries its
 * `expires` timestamp (in seconds) and is dropped on read once it has passed.
 * Keys without a lifetime never expire.
 */
const lifetimes = {
	directed_from: 120,
	state: 120,
	code_verifier: 120,
	email: 300,
	access_token: undefined
} satisfies Record<string, number | undefined>
type StorageKey = keyof typeof lifetimes

interface Entry {
	value: string
	expires?: number
}

const now = () => (Date.now() / 1000) | 0

export function getItem(key: StorageKey) {
	return getEntry(key)?.value
}

export function setItem(
	key: StorageKey,
	value: string,
	maxAge: number | undefined = lifetimes[key]
) {
	const entry: Entry = { value, expires: maxAge === undefined ? undefined : now() + maxAge }
	localStorage.setItem(key, JSON.stringify(entry))
}

export function removeItem(key: StorageKey) {
	localStorage.removeItem(key)
}

export function setToken(accessToken: string, expiresIn: number) {
	setItem('access_token', accessToken, expiresIn)
}

/** The stored token with the seconds it has left, or undefined if absent or expired. */
export function getToken() {
	const entry = getEntry('access_token')
	if (!entry?.expires) return undefined
	return { accessToken: entry.value, expiresIn: entry.expires - now() }
}

function getEntry(key: StorageKey) {
	const raw = localStorage.getItem(key)
	if (raw === null) return undefined
	try {
		const entry = JSON.parse(raw) as Entry
		if (entry.expires === undefined || entry.expires > now()) return entry
	} catch {
		// Unparseable, so treat it like an expired entry.
	}
	localStorage.removeItem(key)
	return undefined
}
