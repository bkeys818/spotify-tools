import { parse, serialize, type CookieSerializeOptions } from 'cookie';
import type { AccessTokenResponse, RefreshTokenResponse } from '$lib/spotify';
import { base } from '$app/paths';

const cookieOptions: CookieSerializeOptions = { path: base };

export const spotifyRefreshToken = (response: RefreshTokenResponse) =>
	serialize('spotify_refresh_token', response.refresh_token, { ...cookieOptions, maxAge: 7776000 });

export const spotifyAccessToken = (response: AccessTokenResponse) =>
	serialize('spotify_access_token', response.access_token, {
		...cookieOptions,
		maxAge: response.expires_in
	});
