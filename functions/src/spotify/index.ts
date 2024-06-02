import { handleError } from './error'
import fetch, { BodyInit } from 'node-fetch'
import { debug } from 'firebase-functions/logger'

export default class Spotify {
	private credentials: Credentials
	setRefreshToken(value: string) {
		this.credentials.refreshToken = value
	}

	constructor(credentials: Credentials) {
		this.credentials = credentials
	}

	private async authRequest<T>(params: Record<string, string>): Promise<T> {
		const { clientId, clientSecret } = this.credentials
		if (!clientId || !clientSecret) throw new Error('Missing credentials')
		const url = 'https://accounts.spotify.com/api/token'
		const res = await fetch(url, {
			headers: {
				Authorization:
					'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			method: 'POST',
			body: new URLSearchParams(params).toString()
		})
		if (res.status < 300) {
			if (res.headers.get('content-type')?.startsWith('application/json'))
				return await res.json()
			else return true as T
		} else {
			const error = await handleError(res)
			debug(error, { context: { url, method: 'POST', params } })
			throw error
		}
	}

	private async request<T>(
		endpoint: string,
		method: 'GET',
		params?: Record<string, JsonPrimative>
	): Promise<T>
	private async request<T>(
		endpoint: string,
		method: 'POST' | 'PUT' | 'DELETE',
		params?: JsonObject
	): Promise<T>
	private async request<T>(
		endpoint: string,
		method: 'GET' | 'POST' | 'PUT' | 'DELETE',
		params?: JsonObject
	): Promise<T> {
		if (!this.credentials.accessToken)
			throw new Error('Missing access token. Please authenticate first.')
		let url = 'https://api.spotify.com/v1/' + endpoint
		let body: BodyInit | undefined
		if (method == 'GET' && params) {
			for (const key in params) if (params[key]) params[key] = params[key]!.toString()
			url += '?' + new URLSearchParams(params as Record<string, string>).toString()
		} else if (params) {
			body = JSON.stringify(params)
		}
		const res = await fetch(url, {
			headers: { Authorization: 'Bearer ' + this.credentials.accessToken },
			method,
			body
		})
		if (res.status < 300) {
			if (res.headers.get('content-type')?.startsWith('application/json'))
				return await res.json()
			else return true as T
		} else {
			const error = await handleError(res)
			debug(error, { context: { url, method, params } })
			throw error
		}
	}

	private async getAll<T>(
		endpoint: string,
		params?: Record<string, JsonPrimative>
	): Promise<T[]> {
		const limit = 50
		const { items, total } = await this.request<SpotifyApi.PagingObject<T>>(endpoint, 'GET', {
			limit,
			fields: 'items,total',
			...params
		})
		const reqN = [...Array(Math.ceil(total / limit)).keys()] // number of request that need to be run
		reqN.shift() // first request has already been run
		const responses = await Promise.all(
			reqN.map(i =>
				this.request<SpotifyApi.PagingObject<T>>(endpoint, 'GET', {
					limit,
					offset: limit * i,
					fields: 'items',
					...params
				})
			)
		)
		items.push(...responses.flatMap(res => res.items))
		return items
	}

	async authorizationCodeGrant(code: string) {
		if (!this.credentials.redirectUri)
			throw new Error('Missing redirect uri. Please authenticate first.')
		const token = await this.authRequest<RefreshToken>({
			code: code,
			redirect_uri: this.credentials.redirectUri,
			grant_type: 'authorization_code'
		})
		this.credentials.refreshToken = token.refresh_token
		this.credentials.accessToken = token.access_token
		return token
	}

	async refreshAccessToken() {
		if (!this.credentials.refreshToken)
			throw new Error('Missing refresh token. Please authenticate first.')
		const token = await this.authRequest<AccessToken>({
			refresh_token: this.credentials.refreshToken,
			grant_type: 'refresh_token'
		})
		this.credentials.accessToken = token.access_token
	}

	getMe() {
		return this.request<SpotifyApi.UserObjectPrivate>('me', 'GET')
	}

	getMySavedTracks() {
		return this.getAll<SpotifyApi.SavedTrackObject>('me/tracks')
	}

	getMyPlaylists() {
		return this.getAll<SpotifyApi.PlaylistObjectSimplified>('me/playlists')
	}

	createPlaylist(userId: string, details: PlaylistDetails) {
		return this.request<SpotifyApi.PlaylistObjectFull>(
			`users/${userId}/playlists`,
			'POST',
			details
		)
	}

	changePlaylistDetails(playlistId: string, details: Partial<PlaylistDetails>) {
		return this.request<void>('playlists/' + playlistId, 'PUT', details)
	}

	getPlaylistTracks(playlistId: string) {
		type SimplifiedPlaylistTrack = { track: { uri: string } | null }
		return this.getAll<SimplifiedPlaylistTrack>(`playlists/${playlistId}/tracks`, {
			fields: 'items.track.uri,total'
		})
	}

	addTracksToPlaylist(playlistId: string, uris: string[]) {
		return this.request<SpotifyApi.PlaylistSnapshotResponse>(
			`playlists/${playlistId}/tracks`,
			'POST',
			{ uris }
		)
	}

	removeTracksToPlaylist(playlistId: string, uris: string[]) {
		return this.request<SpotifyApi.PlaylistSnapshotResponse>(
			`playlists/${playlistId}/tracks`,
			'DELETE',
			{ tracks: uris.map(uri => ({ uri })) }
		)
	}

	usersFollowPlaylist(playlistId: string, userIds: string[]) {
		return this.request<boolean[]>(`playlists/${playlistId}/followers/contains`, 'GET', {
			ids: userIds.join()
		})
	}
}

export type JsonPrimative = string | number | boolean | null
export type JsonArray = Json[]
export type JsonObject = { [key: string]: JsonPrimative | JsonArray | JsonObject }
export type JsonComposite = JsonArray | JsonObject
export type Json = JsonPrimative | JsonComposite

interface Credentials {
	accessToken?: string | undefined
	clientId?: string | undefined
	clientSecret?: string | undefined
	redirectUri?: string | undefined
	refreshToken?: string | undefined
}

interface AccessToken {
	access_token: string
	expires_in: number
	scope: string
	token_type: string
}

interface RefreshToken extends AccessToken {
	refresh_token: string
}

type PlaylistDetails = {
	name: string
	description?: string
	public?: boolean
}
