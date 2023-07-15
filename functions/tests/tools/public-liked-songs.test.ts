import { create, sync } from 'src/tools/public-liked-songs'

test.todo('update synced playlist', () => {
	// new songs are added
	// old songs are removed
	// order matches liked songs
	// updates descriptions
})

describe(create.name, () => {
	describe('new spotify account', () => {
		test.todo('creates new docuemnt')
	})

	describe('no saved playlist id', () => {
		test.todo('can find old playlist')
		test.todo('will create new playlist')
	})

	describe('throws error', () => {
		describe('unauthorized (401)', () => {
			test.todo('unauthorized firebase user')
			test.todo('bad spotify authorization')
		})

		describe('not-found (404)', () => {
			test.todo('user unadded playlist')
		})
	})
})

describe(sync.name, () => {
	describe('delete playlist', () => {
		test.todo('no playlist id')
		test.todo('user unadded playlist')
	})
})
