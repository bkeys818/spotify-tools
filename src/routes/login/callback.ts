import type { RequestHandler } from './__types/callback';
import { getAccessToken } from '$lib/spotify'
import { base } from '$app/paths'

export const get: RequestHandler = async ({ url }) => {
	const code = url.searchParams.get('code');
	if (!code) {
		const error = url.searchParams.get('error');
		return error ? { status: 403 } : { status: 403, body: error };
	}

	console.log(code)
	// const state = url.searchParams.get('state');
	// const cookies = cookie.parse(request.headers.get('cookie') ?? '');
	// if (!(cookies.state && cookies.state === state)) return { status: 301 };

    const response = await getAccessToken(code)
	console.log(response)
	return {
		status: 307,
		headers: {
			// 'set-cookie': cookie.serialize('access_token', access_token, {
			// 	expires: new Date(Date.now() + 1000 * 60 * 24 * 365)
			// }),
			location: url.origin + base
		},
		body: JSON.stringify(response)
	};
};