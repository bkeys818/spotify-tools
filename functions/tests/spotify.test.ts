/** @jest-environment node */
import fetch from 'node-fetch'
import Spotify from 'src/spotify'
import { SpotifyError } from 'src/spotify/error'
import * as utils from 'src/utils'

jest.mock('node-fetch', () => jest.fn())

const mockFetch = fetch as unknown as jest.Mock

test(Spotify.prototype['getAll'].name, async () => {
	type Spy = jest.SpiedFunction<Spotify['request']>
	const spy = jest.spyOn(Spotify.prototype, 'request' as keyof Spotify) as unknown as Spy
	const spotify = new Spotify({})
	const uris = Array.from(Array(53).keys()).map(n => n.toString())
	const tracks = uris.map(uri => ({ item: { uri } }))
	spy.mockImplementationOnce(async () => {
		await new Promise(res => setTimeout(res, 200))
		return { items: tracks.slice(0, 50), total: 53 }
	}).mockResolvedValueOnce({ items: tracks.slice(50) })
	const res = await spotify.getPlaylistItems('playlistId')
	expect(res).toStrictEqual(tracks)
})

describe('retries', () => {
	/** Records the requested waits instead of actually sleeping. */
	let waits: number[]

	beforeEach(() => {
		waits = []
		mockFetch.mockReset()
		jest.spyOn(utils, 'sleep').mockImplementation(ms => {
			waits.push(ms)
			return Promise.resolve()
		})
	})

	afterEach(() => {
		jest.restoreAllMocks()
	})

	function res(status: number, opts: { retryAfter?: string; body?: unknown } = {}) {
		const headers = new Map<string, string>()
		if (opts.retryAfter) headers.set('retry-after', opts.retryAfter)
		if (opts.body !== undefined) headers.set('content-type', 'application/json')
		return {
			status,
			statusText: 'Test',
			headers: { get: (key: string) => headers.get(key) ?? null },
			body: { resume: () => undefined },
			json: () => Promise.resolve(opts.body)
		}
	}

	const ok = res(200, { body: { id: 'userId' } })
	const spotify = () => new Spotify({ accessToken: 'accessToken' })

	test('retries a 429 and honours Retry-After', async () => {
		mockFetch.mockResolvedValueOnce(res(429, { retryAfter: '2' })).mockResolvedValueOnce(ok)
		await expect(spotify().getMe()).resolves.toEqual({ id: 'userId' })
		expect(mockFetch).toHaveBeenCalledTimes(2)
		// Jitter is positive-only, so the wait never undercuts what Spotify asked for.
		expect(waits).toHaveLength(1)
		expect(waits[0]).toBeGreaterThanOrEqual(2000)
		expect(waits[0]).toBeLessThanOrEqual(2400)
	})

	test('backs off exponentially when Retry-After is absent', async () => {
		mockFetch
			.mockResolvedValueOnce(res(429))
			.mockResolvedValueOnce(res(429))
			.mockResolvedValueOnce(ok)
		await expect(spotify().getMe()).resolves.toEqual({ id: 'userId' })
		expect(waits[0]).toBeGreaterThanOrEqual(1000)
		expect(waits[1]).toBeGreaterThanOrEqual(2000)
	})

	test('retries 5xx', async () => {
		mockFetch.mockResolvedValueOnce(res(503)).mockResolvedValueOnce(ok)
		await expect(spotify().getMe()).resolves.toEqual({ id: 'userId' })
		expect(mockFetch).toHaveBeenCalledTimes(2)
	})

	test('gives up rather than sleeping past a long Retry-After', async () => {
		mockFetch.mockResolvedValue(res(429, { retryAfter: '3600', body: {} }))
		await expect(spotify().getMe()).rejects.toBeInstanceOf(SpotifyError)
		expect(mockFetch).toHaveBeenCalledTimes(1)
		expect(waits).toHaveLength(0)
	})

	test('stops after the attempt budget and surfaces the status', async () => {
		mockFetch.mockResolvedValue(res(429, { body: {} }))
		await expect(spotify().getMe()).rejects.toMatchObject({ status: 429 })
		expect(mockFetch).toHaveBeenCalledTimes(4)
	})

	test('does not retry a 4xx that is not 429', async () => {
		mockFetch.mockResolvedValue(
			res(404, { body: { error: { status: 404, message: 'Not found' } } })
		)
		await expect(spotify().getMe()).rejects.toMatchObject({
			status: 404,
			message: 'Not found (404)'
		})
		expect(mockFetch).toHaveBeenCalledTimes(1)
		expect(waits).toHaveLength(0)
	})

	test('retries network errors', async () => {
		mockFetch.mockRejectedValueOnce(new Error('ECONNRESET')).mockResolvedValueOnce(ok)
		await expect(spotify().getMe()).resolves.toEqual({ id: 'userId' })
		expect(mockFetch).toHaveBeenCalledTimes(2)
	})
})
