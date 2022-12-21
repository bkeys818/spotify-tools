import { PUBLIC_CLIENT_ID } from '$env/static/public';

export function createAuthorizeURL(scopes: string[], origin: string) {
	return (
		'https://accounts.spotify.com/authorize?' +
		new URLSearchParams({
			response_type: 'code',
			client_id: PUBLIC_CLIENT_ID,
			scope: scopes.join(' '),
			redirect_uri: origin + '/authorize'
			// state: getState()
		}).toString()
	);
}
