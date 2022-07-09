import { serialize } from 'cookie';
import { base } from '$app/paths';

export function navigateToAuthorize(scopes: string[]) {
	const path = base + '/authorize';
	document.cookie = serialize('active_module', location.pathname, { maxAge: 120, path });
	location.href =
		location.origin +
		path +
		'?' +
		new URLSearchParams({
			scopes: scopes.join(' ')
		}).toString();
}
