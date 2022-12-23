import cookie from 'cookie'

type Keys = 'directed_from_path'

export function getAll(): Partial<Record<Keys, string>> {
	return cookie.parse(document.cookie)
}

export function set(key: Keys, value: string) {
	document.cookie = cookie.serialize(key, value, setOptions[key])
}

const setOptions: Partial<Record<Keys, cookie.CookieSerializeOptions>> = {
	directed_from_path: { maxAge: 120, path: '/authorize' }
}