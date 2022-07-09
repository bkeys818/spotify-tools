import type { Handle, GetSession } from '@sveltejs/kit';
import { refreshAccessToken } from '$lib/spotify';
import { parse } from 'cookie';
import * as cookie from './routes/_cookie';

export const handle: Handle = async ({ event, resolve }) => {
	const cookies = parse(event.request.headers.get('cookie') ?? '');
	if (!cookies.spotify_access_token && cookies.spotify_refresh_token) {
		try {
			const response = await refreshAccessToken(cookies.spotify_refresh_token);
			event.request.headers.set('set-cookie', cookie.spotifyAccessToken.serialize(response));
		} catch {}
	}
	event.locals.spotify = {
		isAuthorized: Boolean(cookies.spotify_access_token),
		scopes: cookies.authorized_scopes?.split(' ') ?? []
	};
	return resolve(event);
};

export const getSession: GetSession = (request) => {
	return { spotify: request.locals.spotify } as any;
};
