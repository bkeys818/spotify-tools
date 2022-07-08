import { credential } from '.';

export function createAuthorizeURL(scopes: string[]) {
	location.href =
		'https://accounts.spotify.com/authorize?' +
		new URLSearchParams({
			response_type: 'code',
			client_id: credential.clientId,
			scope: scopes.join(' '),
			redirect_uri: credential.redirectUri,
			// state: getState()
		}).toString();
}

export async function getAccessToken(code: string): Promise<AccessToken> {
	// check state
	const { VITE_CLIENT_SECRET } = import.meta.env;
	const response = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Authorization:
				'Basic ' + Buffer.from(credential.clientId + ':' + VITE_CLIENT_SECRET).toString('base64')
		},
		body: [
			['grant_type', 'authorization_code'],
			['code', code],
			['redirect_uri', credential.redirectUri]
		]
			.map((a) => a.join('='))
			.join('&')
	});

	if (response.ok) {
		return await response.json();
	} else {
		throw new Error(`Failed to authorize Spotify! Status text: '${response.statusText}'.`);
	}
}

interface AccessToken {
	readonly access_token: string
	readonly token_type: 'Bearer'
	readonly expires_in: number
	readonly refresh_token: string
}