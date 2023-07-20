import ms from '../spotify-mocked'
import { create, sync } from 'src/tools/public-liked-songs'
import { db } from 'src/init'
import { HttpsError, CallableRequest, CallableFunction } from 'firebase-functions/v2/https'

const doc = db.doc('public-liked-songs/userId')
const scheduleTime = new Date().toISOString()

afterEach(async () => {
	if ((await doc.get()).exists) await doc.delete()
	jest.clearAllMocks()
})

describe('update', () => {
	beforeEach(async () => {
		await doc.create({ refresh_token: 'userId', playlist_id: 'playlistId' })
	})
	function toTracks<T>(uris: string[]): T[] {
		return uris.map(uri => ({ track: { uri } } as T))
	}
	function getUris(calls: [string, string[]][]) {
		return calls.flatMap(([, uris]) => uris)
	}

	test('update synced playlist', async () => {
		const savedTrackUris = ['uri1', 'uri3', 'uri4', 'uri5']
		const playlistTrackUris = ['uri2', 'uri4', 'uri6', 'uri7']
		ms.getMySavedTracks.mockImplementationOnce(async () =>
			toTracks<SpotifyApi.SavedTrackObject>(savedTrackUris)
		)
		ms.getPlaylistTracks.mockImplementationOnce(async () =>
			toTracks<SpotifyApi.PlaylistTrackObject>(playlistTrackUris)
		)
		await sync.run({ scheduleTime })
		const added = getUris(ms.addTracksToPlaylist.mock.calls)
		const removed = getUris(ms.removeTracksToPlaylist.mock.calls)
		expect(added.reverse()).toEqual(['uri1', 'uri3', 'uri5'])
		expect(removed.sort()).toEqual(['uri2', 'uri6', 'uri7'])
	})

	test('Update are made in order', async () => {
		const savedTrackUris = Array.from(Array(103).keys()).map(n => n.toString())

		ms.getMySavedTracks.mockImplementationOnce(async () =>
			toTracks<SpotifyApi.SavedTrackObject>(savedTrackUris)
		)
		ms.addTracksToPlaylist
			.mockImplementationOnce(async () => {
				await new Promise(res => setTimeout(res, 200))
				return { snapshot_id: 'snapshotId' }
			})
			.mockImplementationOnce(async () => ({ snapshot_id: 'snapshotId' }))
		await sync.run({ scheduleTime })
		const added = getUris(ms.addTracksToPlaylist.mock.calls)
		expect(added.reverse()).toEqual(savedTrackUris)
	})
})

describe(create.name, () => {
	type Data<F> = F extends CallableFunction<infer T, unknown> ? T : never
	const data: Data<typeof create> = { code: 'some_code', origin: 'http://localhost:5050' }
	const rawRequest = {} as CallableRequest<unknown>['rawRequest']
	type Auth = NonNullable<CallableRequest<unknown>['auth']>
	const auth: Auth = {
		uid: testEnv.auth.exampleUserRecord().uid,
		token: {} as Auth['token']
	}

	describe('new spotify account', () => {
		test('creates new docuemnt', async () => {
			await create.run({ data, auth, rawRequest })
			expect((await doc.get()).exists).toBeTruthy()
		})
	})

	describe('no saved playlist id', () => {
		beforeEach(async () => {
			await doc.create({ refresh_token: 'userId' })
		})

		test('find old playlist', async () => {
			const playlistId = 'somePlaylistId'
			ms.getMyPlaylists.mockImplementationOnce(async () => [
				{
					name: "user's Liked Songs",
					id: playlistId
				} as SpotifyApi.PlaylistObjectSimplified
			])
			await create.run({ data, auth, rawRequest })
			expect(ms.createPlaylist).not.toBeCalled()
			expect((await doc.get()).data()).toHaveProperty('playlist_id', playlistId)
		})

		test('will create new playlist', async () => {
			await create.run({ data, auth, rawRequest })
			expect(ms.createPlaylist).toBeCalledTimes(1)
			expect((await doc.get()).data()).toHaveProperty('playlist_id', 'playlistId')
		})
	})

	describe('throws error', () => {
		describe('unauthorized (401)', () => {
			test('unauthorized firebase user', async () => {
				try {
					await create.run({ data, rawRequest })
					fail('An error should have been thrown.')
				} catch (err) {
					expect(err).toBeInstanceOf(HttpsError)
					expect(err).toHaveProperty('code', 'unauthenticated')
				}
			})

			test('bad spotify authorization', async () => {
				ms.authorizationCodeGrant.mockRejectedValueOnce(
					new Error('Invalid refresh token (invalid_grant)')
				)
				try {
					await create.run({ data, auth, rawRequest })
					fail('An error should have been thrown.')
				} catch (err) {
					expect(ms.authorizationCodeGrant).toBeCalledTimes(1)
					expect(ms.getMe).not.toHaveBeenCalled()
					expect(err).toBeInstanceOf(HttpsError)
					expect(err).toHaveProperty('code', 'unauthenticated')
				}
			})
		})

		describe('not-found (404)', () => {
			test('user unadded playlist', async () => {
				ms.usersFollowPlaylist.mockImplementationOnce(async () => [false])
				try {
					await create.run({ data, auth, rawRequest })
					fail('An error should have been thrown.')
				} catch (err) {
					expect(ms.getPlaylistTracks).not.toHaveBeenCalled()
					expect(err).toBeInstanceOf(HttpsError)
					expect(err).toHaveProperty('code', 'not-found')
				}
			})
		})
	})
})

describe(sync.name, () => {
	describe('delete playlist', () => {
		beforeEach(async () => {
			await doc.create({ refresh_token: 'userId' })
		})
		test('no playlist id', async () => {
			await sync.run({ scheduleTime })
			expect(ms.getPlaylistTracks).not.toHaveBeenCalled()
			expect((await doc.get()).exists).toBeFalsy()
		})

		test('user unadded playlist', async () => {
			await doc.update({ playlist_id: 'playlistId' })
			ms.usersFollowPlaylist.mockImplementationOnce(async () => [false])
			await sync.run({ scheduleTime })
			expect(ms.getPlaylistTracks).not.toHaveBeenCalled()
			expect((await doc.get()).exists).toBeFalsy()
		})
	})
})
