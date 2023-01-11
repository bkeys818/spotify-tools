import cookie from 'cookie'

export function getAllCookies(): Partial<Record<keyof typeof setOptions, string>> {
	return cookie.parse(document.cookie)
}

export function setCookie(key: keyof typeof setOptions, value: string) {
	document.cookie = cookie.serialize(key, value, setOptions[key])
}

const setOptions: Partial<Record<string, cookie.CookieSerializeOptions>> = {
	directed_from_path: { maxAge: 120, path: '/authorize' },
	state: { maxAge: 120, path: '/authorize' }
}
