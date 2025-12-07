import cookie, { type CookieSerializeOptions } from 'cookie'

export function getAllCookies(): Partial<Record<CookieKey, string>> {
	return cookie.parse(document.cookie)
}

export function setCookie(key: CookieKey, value: string) {
	document.cookie = cookie.serialize(key, value, setOptions[key])
}

export function setTokenCookie(path: string, accessToken: string, expiresIn: number) {
	const options = { maxAge: expiresIn, path }
	document.cookie = cookie.serialize('access_token', accessToken, options)
	const expirationDate = ((Date.now() / 1000) | 0) + expiresIn
	document.cookie = cookie.serialize('auth_expiration', expirationDate.toString(), options)
}

const setOptions = {
	directed_from: { maxAge: 120, path: '/authorize' },
	state: { maxAge: 120, path: '/authorize' },
	email: { maxAge: 300, path: '/login/callback' },
	access_token: {},
	auth_expiration: {}
} satisfies Partial<Record<string, CookieSerializeOptions>>
type CookieKey = keyof typeof setOptions
