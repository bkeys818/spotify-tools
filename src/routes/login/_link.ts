import { serialize } from 'cookie';
import { base } from '$app/paths';

export function navigateToLogin(scopes: string[]) {
	document.cookie = serialize('active_module', location.pathname, {
		expires: new Date(Date.now() + 360_000)
	});
	location.href =
		location.origin +
		base +
		'/login?' +
		new URLSearchParams({
			scopes: scopes.join(' ')
		}).toString();
}
