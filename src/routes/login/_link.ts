import { serialize } from 'cookie';
import { base } from '$app/paths';

export function navigateToLogin(scopes: string[]) {
	const path = base + '/login';
	document.cookie = serialize('active_module', location.pathname, { maxAge: 120, path });
	location.href =
		location.origin +
		path +
		'?' +
		new URLSearchParams({
			scopes: scopes.join(' ')
		}).toString();
}
