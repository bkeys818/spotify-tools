import { credential } from '.';

export function createAuthorizeURL(scopes: string[]) {
	return (
		'https://accounts.spotify.com/authorize?' +
		new URLSearchParams({
			response_type: 'code',
			client_id: credential.clientId,
			scope: scopes.join(' '),
			redirect_uri: credential.redirectUri
			// state: getState()
		}).toString()
	);
}

function tokenRequest(body: [string, string][]) {
	const { CLIENT_SECRET } = import.meta.env;
	return fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			Authorization:
				'Basic ' + Buffer.from(credential.clientId + ':' + CLIENT_SECRET).toString('base64')
		},
		body: body.map((a) => a.join('=')).join('&')
	});
}

export async function getAccessToken(code: string): Promise<RefreshTokenResponse> {
	// check state
	const response = await tokenRequest([
		['grant_type', 'authorization_code'],
		['code', code],
		['redirect_uri', credential.redirectUri]
	]);
	if (response.ok) {
		return await response.json();
	} else {
		throw new Error(`Failed to get access token! Status text: '${response.statusText}'.`);
	}
}

export async function refreshAccessToken(refreshToken: string): Promise<AccessTokenResponse> {
	const response = await tokenRequest([
		['grant_type', 'refresh_token'],
		['refresh_token', refreshToken]
	]);
	if (response.ok) {
		return await response.json();
	} else {
		throw new Error(`Failed to refresh access token! Status text: '${response.statusText}'.`);
	}
}

export interface AccessTokenResponse {
	readonly access_token: string;
	readonly token_type: 'Bearer';
	readonly expires_in: number;
}

export interface RefreshTokenResponse extends AccessTokenResponse {
	readonly refresh_token: string;
}

export function sessionIsAuthorized(session: App.Session, scopes?: string[]) {
	if (!session.spotify?.isAuthorized) return false;
	else if (scopes && scopes.every((scope) => session.spotify?.scopes.includes(scope))) return true;
	else return true;
}
