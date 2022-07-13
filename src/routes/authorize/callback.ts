import type { RequestHandler } from './__types/callback';
import { getAccessToken } from '$lib/spotify';
import { base } from '$app/paths';
import * as cookie from '../_cookie'
import { setDataFor } from '$lib/firebase/database'
import spotifyWebApi from 'spotify-web-api-node'

export const get: RequestHandler = async ({ url, request }) => {
	const code = url.searchParams.get('code');
	if (!code) {
		const error = url.searchParams.get('error');
		return error ? { status: 403 } : { status: 403, body: error };
	}

	const cookieHeader = request.headers.get('cookie')
	// console.log(cookies);
	// const state = url.searchParams.get('state');
	// const cookies = cookie.parse(request.headers.get('cookie') ?? '');
	// if (!(cookies.state && cookies.state === state)) return { status: 301 };

	const response = await getAccessToken(code);

	const path = cookie.directedFromPath.parse(cookieHeader)
	console.log(path)
	if (path && path.startsWith(base + '/tools/')) {
		const tool = path.slice(path.lastIndexOf('/') + 1)
		console.log(tool)
		const spotify = new spotifyWebApi({ accessToken: response.access_token })
		const user = await spotify.getMe()
		await setDataFor(tool as any, user.body.id, { refresh_token: response.refresh_token })
	}

	return {
		status: 307,
		headers: {
			'set-cookie': [
				cookie.spotifyRefreshToken.serialize(response.refresh_token),
				cookie.spotifyAccessToken.serialize(response)
			],
			location: url.origin + (path ?? base)
		}
	};
};
