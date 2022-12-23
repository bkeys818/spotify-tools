import { PUBLIC_CLIENT_ID } from '$env/static/public'

export function authorize(scopes?: string) {
	const params = new URLSearchParams({
		response_type: 'code',
		client_id: PUBLIC_CLIENT_ID,
		redirect_uri: location.origin + '/authorize',
	})
	if (scopes) params.set('scope', scopes)
	location.href = 'https://accounts.spotify.com/authorize?' + params.toString()
}

export interface AccessTokenResponse {
	readonly access_token: string
	readonly token_type: 'Bearer'
	readonly expires_in: number
}
