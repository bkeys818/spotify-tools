import cookie from 'cookie'
import { base } from '$app/paths'

export const directedFromPath = createContext('directed_from_path', {
	maxAge: 120,
	path: base + '/authorize'
})

function createContext(
	name: string,
	serialize?: cookie.CookieSerializeOptions,
	parse?: cookie.CookieParseOptions
): {
	serialize: (value: string | null) => ReturnType<typeof cookie.serialize>
	parse: (value: string | null) => string | undefined
}
function createContext<P extends unknown[]>(
	name: string,
	serialize?: (...params: P) => cookie.CookieSerializeOptions & { value: string },
	parse?: cookie.CookieParseOptions
): {
	serialize: (...params: P) => ReturnType<typeof cookie.serialize>
	parse: (value: string | null) => string | undefined
}
function createContext<P extends unknown[]>(
	name: string,
	serialize?:
		| cookie.CookieSerializeOptions
		| ((...params: P) => cookie.CookieSerializeOptions & { value: string }),
	parse?: cookie.CookieParseOptions
) {
	return {
		serialize:
			typeof serialize == 'function'
				? (...params: P) => {
						const { value, ...options } = serialize(...params)
						return cookie.serialize(name, value, options)
				  }
				: (value: string) => cookie.serialize(name, value, serialize),
		parse: (value: string | null) =>
			value ? (cookie.parse(value, parse)[name] as string | undefined) : undefined
	}
}
