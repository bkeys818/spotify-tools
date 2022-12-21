import * as cookie from '../cookie'
import { base } from '$app/paths'

export function navigateToAuthorize(scopes: string[]) {
	document.cookie = cookie.directedFromPath.serialize(location.pathname)
	location.href = base + '/authorize?scopes=' + encodeURIComponent(scopes.join(' '))
}
