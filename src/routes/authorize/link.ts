import { setCookie } from '$lib/cookie'

export function navigateToAuthorize(scopes: string[]) {
	setCookie('directed_from_path', location.pathname)
	location.href = '/authorize?scopes=' + encodeURIComponent(scopes.join(' '))
}
