import * as cookie from '$lib/cookie' 

export function navigateToAuthorize(scopes: string[]) {
	cookie.set('directed_from_path', location.pathname)
	location.href = '/authorize?scopes=' + encodeURIComponent(scopes.join(' '))
}
