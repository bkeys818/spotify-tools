import ms from '../spotify-mocked'
import { create, sync, populate } from 'src/tools/public-liked-songs'
import { sendReauthorizeEmail } from 'src/reauthorize'
import { db } from 'src/init'
import { FieldValue, Timestamp } from 'firebase-admin/firestore'
import { HttpsError, CallableRequest, CallableFunction } from 'firebase-functions/v2/https'

// Only the send is mocked; the expiry date math stays real so the tests
// exercise it.
jest.mock('src/reauthorize', () => ({
	...jest.requireActual<typeof import('src/reauthorize')>('src/reauthorize'),
	sendReauthorizeEmail: jest.fn().mockResolvedValue(true)
}))
const sendEmail = jest.mocked(sendReauthorizeEmail)

afterEach(async () => {
	if ((await doc.get()).exists) await doc.delete()
	jest.clearAllMocks()
})

type Data<F> = F extends CallableFunction<infer T, unknown> ? T : never
const doc = db.doc('public-liked-songs/userId')
const scheduleTime = new Date().toISOString()
const rawRequest = {} as CallableRequest<unknown>['rawRequest']
type Auth = NonNullable<CallableRequest<unknown>['auth']>
const auth: Auth = {
	uid: testEnv.auth.exampleUserRecord().uid,
	token: {} as Auth['token']
}
const refresh_token = 'refreshToken'
const playlist_id = 'playlistId'
const origin = 'http://localhost:5050'

describe('create', () => {
	const data: Data<typeof create> = { code: 'some_code', origin }

	describe('new spotify account', () => {
		test('creates new docuemnt', async () => {
			await create.run({ data, auth, rawRequest })
			const snapshot = await doc.get()
			expect(snapshot.exists).toBeTruthy()
			expect(snapshot.data()).toMatchObject({ refresh_token, origin, uid: auth.uid })
			expect(snapshot.data()?.authorized_at).toBeInstanceOf(Timestamp)
		})
	})

	describe('existing document', () => {
		test('re-arms the expiry reminder', async () => {
			await doc.create({ refresh_token: 'old', playlist_id, reminded_at: Timestamp.now() })
			await create.run({ data, auth, rawRequest })
			const saved = (await doc.get()).data()
			expect(saved).toMatchObject({ refresh_token, playlist_id })
			expect(saved).not.toHaveProperty('reminded_at')
			expect(saved?.authorized_at).toBeInstanceOf(Timestamp)
		})
	})

	describe('no saved playlist id', () => {
		beforeEach(async () => {
			await doc.create({ refresh_token })
		})

		test('find old playlist', async () => {
			const playlistId = 'somePlaylistId'
			ms.getMyPlaylists.mockResolvedValueOnce([
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
			ms.usersFollowPlaylist.mockResolvedValueOnce([false])
			try {
				await create.run({ data, auth, rawRequest })
				fail('An error should have been thrown.')
			} catch (err) {
				expect(ms.getPlaylistItems).not.toHaveBeenCalled()
				expect(err).toBeInstanceOf(HttpsError)
				expect(err).toHaveProperty('code', 'not-found')
			}
		})
	})
})

describe('populate', () => {
	const data: Data<typeof populate> = { origin, userId: 'userId' }
	describe('update playlist', () => {
		beforeEach(async () => {
			await doc.create({ playlist_id, refresh_token })
		})
		function toTracks<T>(uris: string[]): T[] {
			return uris.map(uri => ({ track: { uri } }) as T)
		}
		function toItems(uris: string[]) {
			return uris.map(uri => ({ item: { uri } }))
		}
		function getUris(calls: [string, string[]][]) {
			return calls.flatMap(([, uris]) => uris)
		}

		test('update synced playlist', async () => {
			const savedTrackUris = ['uri1', 'uri3', 'uri4', 'uri5']
			const playlistTrackUris = ['uri2', 'uri4', 'uri6', 'uri7']
			ms.getMySavedTracks.mockResolvedValueOnce(
				toTracks<SpotifyApi.SavedTrackObject>(savedTrackUris)
			)
			ms.getPlaylistItems.mockResolvedValueOnce(toItems(playlistTrackUris))
			await sync.run({ scheduleTime })
			const added = getUris(ms.addItemsToPlaylist.mock.calls)
			const removed = getUris(ms.removeItemsToPlaylist.mock.calls)
			expect(added.reverse()).toEqual(['uri1', 'uri3', 'uri5'])
			expect(removed.sort()).toEqual(['uri2', 'uri6', 'uri7'])
		})

		test('Update are made in order', async () => {
			const savedTrackUris = Array.from(Array(103).keys()).map(n => n.toString())

			ms.getMySavedTracks.mockResolvedValueOnce(
				toTracks<SpotifyApi.SavedTrackObject>(savedTrackUris)
			)
			ms.addItemsToPlaylist
				.mockImplementationOnce(async () => {
					await new Promise(res => setTimeout(res, 200))
					return { snapshot_id: 'snapshotId' }
				})
				.mockResolvedValueOnce({ snapshot_id: 'snapshotId' })
			await sync.run({ scheduleTime })
			const added = getUris(ms.addItemsToPlaylist.mock.calls)
			expect(added.reverse()).toEqual(savedTrackUris)
		})
	})

	describe('unauthorized (401)', () => {
		test('unauthorized firebase user', async () => {
			try {
				await populate.run({ data, rawRequest })
				fail('An error should have been thrown.')
			} catch (err) {
				expect(err).toBeInstanceOf(HttpsError)
				expect(err).toHaveProperty('code', 'unauthenticated')
			}
		})

		test('bad spotify authorization', async () => {
			await doc.create({ playlist_id, refresh_token })
			ms.refreshAccessToken.mockRejectedValueOnce(
				new Error('Invalid refresh token (invalid_grant)')
			)
			try {
				await populate.run({ data, auth, rawRequest })
				fail('An error should have been thrown.')
			} catch (err) {
				expect(ms.refreshAccessToken).toBeCalledTimes(1)
				expect(ms.getMySavedTracks).not.toHaveBeenCalled()
				expect(err).toBeInstanceOf(HttpsError)
				expect(err).toHaveProperty('code', 'unauthenticated')
			}
			const saved = (await doc.get()).data()
			expect(saved).not.toHaveProperty('refresh_token')
			expect(saved).toHaveProperty('playlist_id', playlist_id)
		})
	})

	describe('not-found (404)', () => {
		test('no document for user', async () => {
			try {
				await populate.run({ data, auth, rawRequest })
				fail('An error should have been thrown.')
			} catch (err) {
				expect(err).toBeInstanceOf(HttpsError)
				expect(err).toHaveProperty('code', 'not-found')
			}
		})

		test('no playlist id for user', async () => {
			await doc.create({ refresh_token })
			try {
				await populate.run({ data, auth, rawRequest })
				fail('An error should have been thrown.')
			} catch (err) {
				expect(err).toBeInstanceOf(HttpsError)
				expect(err).toHaveProperty('code', 'not-found')
			}
		})
	})
})

describe('sync', () => {
	describe('delete playlist', () => {
		beforeEach(async () => {
			await doc.create({ refresh_token: 'userId' })
		})
		test('no playlist id', async () => {
			await sync.run({ scheduleTime })
			expect(ms.getPlaylistItems).not.toHaveBeenCalled()
			expect((await doc.get()).exists).toBeFalsy()
		})

		test('user unadded playlist', async () => {
			await doc.update({ playlist_id: 'playlistId' })
			ms.usersFollowPlaylist.mockResolvedValueOnce([false])
			await sync.run({ scheduleTime })
			expect(ms.getPlaylistItems).not.toHaveBeenCalled()
			expect((await doc.get()).exists).toBeFalsy()
		})
	})

	describe('expired token', () => {
		beforeEach(async () => {
			await doc.create({ refresh_token, playlist_id, uid: auth.uid, origin })
		})

		test('drops the token and emails the user', async () => {
			// Spotify's body for an expired token carries no description.
			ms.refreshAccessToken.mockRejectedValueOnce(new Error('{"error":"invalid_grant"}'))
			await sync.run({ scheduleTime })
			expect(ms.getPlaylistItems).not.toHaveBeenCalled()
			const saved = (await doc.get()).data()
			expect(saved).not.toHaveProperty('refresh_token')
			expect(saved).toHaveProperty('playlist_id', playlist_id)
			expect(sendEmail).toBeCalledTimes(1)
			expect(sendEmail).toBeCalledWith(
				expect.objectContaining({ uid: auth.uid, origin, kind: 'expired' })
			)
		})

		test('leaves users waiting to reconnect alone', async () => {
			await doc.update({ refresh_token: FieldValue.delete() })
			await sync.run({ scheduleTime })
			expect(ms.refreshAccessToken).not.toHaveBeenCalled()
			expect(sendEmail).not.toHaveBeenCalled()
			expect((await doc.get()).exists).toBeTruthy()
		})
	})

	describe('expiry reminder', () => {
		/** `authorized_at` such that the token expires `days` from now. */
		function expiringIn(days: number) {
			const date = new Date()
			date.setMonth(date.getMonth() - 6)
			date.setDate(date.getDate() + days)
			return Timestamp.fromDate(date)
		}

		beforeEach(async () => {
			await doc.create({ refresh_token, playlist_id, uid: auth.uid, origin })
		})

		test('emails once when expiring soon', async () => {
			await doc.update({ authorized_at: expiringIn(7) })
			await sync.run({ scheduleTime })
			expect(sendEmail).toBeCalledTimes(1)
			expect(sendEmail).toBeCalledWith(
				expect.objectContaining({ uid: auth.uid, origin, kind: 'expiring' })
			)
			expect(sendEmail.mock.calls[0][0].authorizedAt).toBeInstanceOf(Timestamp)
			expect((await doc.get()).data()?.reminded_at).toBeInstanceOf(Timestamp)
			expect(ms.getPlaylistItems).toBeCalledTimes(1)

			await sync.run({ scheduleTime })
			expect(sendEmail).toBeCalledTimes(1)
		})

		test('no email while the token is fresh', async () => {
			await doc.update({ authorized_at: Timestamp.now() })
			await sync.run({ scheduleTime })
			expect(sendEmail).not.toHaveBeenCalled()
			expect((await doc.get()).data()).not.toHaveProperty('reminded_at')
		})

		test('no email without an authorization date', async () => {
			await sync.run({ scheduleTime })
			expect(sendEmail).not.toHaveBeenCalled()
		})

		test('a failed send is retried next run', async () => {
			await doc.update({ authorized_at: expiringIn(7) })
			sendEmail.mockRejectedValueOnce(new Error('Failed to send email'))
			await sync.run({ scheduleTime })
			expect((await doc.get()).data()).not.toHaveProperty('reminded_at')
			expect(ms.getPlaylistItems).toBeCalledTimes(1)
		})
	})
})
