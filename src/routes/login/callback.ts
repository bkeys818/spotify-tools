import type { RequestHandler } from './__types/callback';
import { getAccessToken } from '$lib/spotify'
import { base } from '$app/paths'
import { parse, serialize } from 'cookie'

export const get: RequestHandler = async ({ url, request }) => {
	const code = url.searchParams.get('code');
	if (!code) {
		const error = url.searchParams.get('error');
		return error ? { status: 403 } : { status: 403, body: error };
	}

	const cookies = parse(request.headers.get('cookie') ?? '')
	// const state = url.searchParams.get('state');
	// const cookies = cookie.parse(request.headers.get('cookie') ?? '');
	// if (!(cookies.state && cookies.state === state)) return { status: 301 };

    const response = await getAccessToken(code)
	console.log(response)
	return {
		status: 307,
		headers: {
			'set-cookie': serialize('access_token', response.access_token, {
				expires: new Date(Date.now() + response.expires_in)
			}),
			location: cookies.active_module ?? url.origin + base
		},
		body: JSON.stringify(response)
	};
};