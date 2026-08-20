import { handleError, parseRetryAfter, SpotifyError } from './error'
import fetch, { BodyInit, RequestInit, Response } from 'node-fetch'
import { warn } from 'firebase-functions/logger'
import { formatError, mapWithConcurrency, sleep } from '../utils'

/** Total attempts per request, including the first. */
const MAX_ATTEMPTS = 4
/** Never sleep longer than this for one retry — the function has a timeout to respect. */
const MAX_RETRY_WAIT_MS = 30_000
/** Page requests in flight at once within a single `getAll`. */
const PAGE_CONCURRENCY = 3
/** Query/body keys that must never reach the logs. */
const SECRET_KEYS = ['code', 'refresh_token', 'client_secret', 'access_token']

export default class Spotify {
	private credentials: Credentials
	setRefreshToken(value: string) {
		this.credentials.refreshToken = value
	}

	constructor(credentials: Credentials) {
		this.credentials = credentials
	}

	/**
	 * `fetch` plus retries on 429, 5xx and network errors. Returns the final
	 * response either way, so an exhausted retry budget still flows through the
	 * caller's normal error path.
	 */
	private async fetchWithRetry(url: string, init: RequestInit, context: LogContext) {
		for (let attempt = 0; ; attempt++) {
			const last = attempt >= MAX_ATTEMPTS - 1
			let res: Response
			try {
				res = await fetch(url, init)
			} catch (err) {
				const waitMs = jitter(backoffMs(attempt))
				if (last || waitMs > MAX_RETRY_WAIT_MS) throw err
				warn('Spotify request failed, retrying.', {
					...context,
					attempt: attempt + 1,
					waitMs,
					error: formatError(err)
				})
				await sleep(waitMs)
				continue
			}
			if (!isRetryable(res.status)) return res
			const retryAfter = parseRetryAfter(res.headers.get('retry-after'))
			const waitMs = jitter(retryAfter ? retryAfter * 1000 : backoffMs(attempt))
			if (last || waitMs > MAX_RETRY_WAIT_MS) return res
			warn('Spotify returned a retryable status, retrying.', {
				...context,
				status: res.status,
				retryAfter,
				attempt: attempt + 1,
				waitMs
			})
			res.body?.resume() // drop the unread body so the socket is released
			await sleep(waitMs)
		}
	}

	private async authRequest<T>(params: Record<string, string>): Promise<T> {
		const { clientId, clientSecret } = this.credentials
		if (!clientId || !clientSecret) throw new Error('Missing credentials')
		const url = 'https://accounts.spotify.com/api/token'
		const context = { url, method: 'POST', params: redact(params) }
		const res = await this.fetchWithRetry(
			url,
			{
				headers: {
					Authorization:
						'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64'),
					'Content-Type': 'application/x-www-form-urlencoded'
				},
				method: 'POST',
				body: new URLSearchParams(params).toString()
			},
			context
		)
		if (res.status < 300) {
			if (res.headers.get('content-type')?.startsWith('application/json'))
				return (await res.json()) as T
			else return true as T
		} else {
			const error = await handleError(res)
			logFailure(error, context)
			throw error
		}
	}

	private async request<T>(
		endpoint: string,
		method: 'GET',
		params?: Record<string, string>
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
			url += '?' + new URLSearchParams(params as Record<string, string>).toString()
		} else if (params) {
			body = JSON.stringify(params)
		}
		const context = { url, method, params: redact(params) }
		const res = await this.fetchWithRetry(
			url,
			{
				headers: { Authorization: 'Bearer ' + this.credentials.accessToken },
				method,
				body
			},
			context
		)
		if (res.status < 300) {
			if (res.headers.get('content-type')?.startsWith('application/json'))
				return (await res.json()) as T
			else return true as T
		} else {
			const error = await handleError(res)
			logFailure(error, context)
			throw error
		}
	}

	private async getAll<T>(endpoint: string, params?: Record<string, string>): Promise<T[]> {
		const limit = 50
		const { items, total } = await this.request<SpotifyApi.PagingObject<T>>(endpoint, 'GET', {
			limit: limit.toString(),
			fields: 'items,total',
			...params
		})
		const reqN = [...Array(Math.ceil(total / limit)).keys()] // number of request that need to be run
		reqN.shift() // first request has already been run
		const responses = await mapWithConcurrency(reqN, PAGE_CONCURRENCY, i =>
			this.request<SpotifyApi.PagingObject<T>>(endpoint, 'GET', {
				limit: limit.toString(),
				offset: (limit * i).toString(),
				fields: 'items',
				...params
			})
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

	createPlaylist(details: PlaylistDetails) {
		return this.request<SpotifyApi.PlaylistObjectFull>(`me/playlists`, 'POST', details)
	}

	changePlaylistDetails(playlistId: string, details: Partial<PlaylistDetails>) {
		return this.request<void>('playlists/' + playlistId, 'PUT', details)
	}

	getPlaylistItems(playlistId: string) {
		type SimplifiedPlaylistItem = { item: { uri: string } | null }
		return this.getAll<SimplifiedPlaylistItem>(`playlists/${playlistId}/items`, {
			fields: 'items.item.uri,total'
		})
	}

	addItemsToPlaylist(playlistId: string, uris: string[]) {
		return this.request<SpotifyApi.PlaylistSnapshotResponse>(
			`playlists/${playlistId}/items`,
			'POST',
			{ uris }
		)
	}

	removeItemsToPlaylist(playlistId: string, uris: string[]) {
		return this.request<SpotifyApi.PlaylistSnapshotResponse>(
			`playlists/${playlistId}/items`,
			'DELETE',
			{ items: uris.map(uri => ({ uri })) }
		)
	}

	usersFollowPlaylist(playlistIds: string[]) {
		return this.request<boolean[]>(`me/library/contains`, 'GET', {
			uris: playlistIds.map(id => `spotify:playlist:${id}`).join()
		})
	}
}

type LogContext = { url: string; method: string; params?: Json }

function isRetryable(status: number) {
	return status == 429 || status >= 500
}

function backoffMs(attempt: number) {
	return 2 ** attempt * 1000
}

/** Positive-only jitter, so a `Retry-After` is never undercut but callers still desync. */
function jitter(ms: number) {
	return Math.round(ms * (1 + Math.random() * 0.2))
}

function redact(params?: Json): Json | undefined {
	if (typeof params != 'object' || params === null || Array.isArray(params)) return params
	return Object.fromEntries(
		Object.entries(params).map(([key, value]) => [
			key,
			SECRET_KEYS.includes(key) ? '[redacted]' : value
		])
	)
}

function logFailure(error: SpotifyError, context: LogContext) {
	warn('Spotify request failed.', { ...context, status: error.status, error: formatError(error) })
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
