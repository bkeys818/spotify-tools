import cookie from 'cookie'
import { base } from '$app/paths'
import type { AccessTokenResponse } from '$lib/spotify'

export const parse = cookie.parse

export const spotifyRefreshToken = createContext('spotify_refresh_token', {
	path: base,
	maxAge: 7776000
})

export const spotifyAccessToken = createContext(
	'spotify_access_token',
	(response: AccessTokenResponse) => ({
		value: response.access_token,
		path: base,
		maxAge: response.expires_in
	})
)

export const spotifyScopes = createContext(
	'spotify_scopes',
	(scopes: string[], cookieStr: Document['cookie']) => {
		let allScopes = scopes
		const cookies = cookie.parse(cookieStr)
		if (cookies.scopes) allScopes.push(...cookies.scopes.split(' '))
		return { value: allScopes.join(' '), maxAge: 3600, path: base }
	}
)

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
function createContext<P extends any[]>(
	name: string,
	serialize?: (...params: P) => cookie.CookieSerializeOptions & { value: string },
	parse?: cookie.CookieParseOptions
): {
	serialize: (...params: P) => ReturnType<typeof cookie.serialize>
	parse: (value: string | null) => string | undefined
}
function createContext<P extends any[]>(
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
