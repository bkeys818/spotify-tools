import cookie, { type CookieSerializeOptions } from 'cookie'

export function getAllCookies(): Partial<Record<CookieKey, string>> {
	return cookie.parse(document.cookie)
}

export function setCookie(key: CookieKey, value: string) {
	document.cookie = cookie.serialize(key, value, setOptions[key])
}

export function deleteCookie(key: CookieKey) {
	document.cookie = cookie.serialize(key, '', { ...setOptions[key], maxAge: 0 })
}

/**
 * Site-wide, not scoped to the tool's path. React Router commits the new
 * history entry only *after* the redirect target's loaders have run, so while
 * those loaders execute `document.cookie` is still filtered by `/authorize` and
 * a path-scoped token would be invisible to `readToken()`.
 */
export function setTokenCookie(accessToken: string, expiresIn: number) {
	const options = { ...setOptions.access_token, maxAge: expiresIn }
	document.cookie = cookie.serialize('access_token', accessToken, options)
	const expirationDate = ((Date.now() / 1000) | 0) + expiresIn
	document.cookie = cookie.serialize('auth_expiration', expirationDate.toString(), options)
}

const setOptions = {
	directed_from: { maxAge: 120, path: '/authorize' },
	state: { maxAge: 120, path: '/authorize' },
	code_verifier: { maxAge: 120, path: '/authorize' },
	email: { maxAge: 300, path: '/login/callback' },
	access_token: { path: '/' },
	auth_expiration: { path: '/' }
} satisfies Partial<Record<string, CookieSerializeOptions>>
type CookieKey = keyof typeof setOptions
