import type { RequestHandler } from './__types/callback';
import { getAccessToken } from '$lib/spotify';
import { base } from '$app/paths';
import { parse } from 'cookie';
import * as seriazlizeCookie from '../../_serialize-cookies'

export const get: RequestHandler = async ({ url, request }) => {
	const code = url.searchParams.get('code');
	if (!code) {
		const error = url.searchParams.get('error');
		return error ? { status: 403 } : { status: 403, body: error };
	}

	const cookies = parse(request.headers.get('cookie') ?? '')
	// console.log(cookies);
	// const state = url.searchParams.get('state');
	// const cookies = cookie.parse(request.headers.get('cookie') ?? '');
	// if (!(cookies.state && cookies.state === state)) return { status: 301 };

	const response = await getAccessToken(code);
	return {
		status: 307,
		headers: {
			'set-cookie': [
				seriazlizeCookie.spotifyRefreshToken(response),
				seriazlizeCookie.spotifyAccessToken(response)
			],
			location: cookies.active_module ?? url.origin + base
		}
	};
};
