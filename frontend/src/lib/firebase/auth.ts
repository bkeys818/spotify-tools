import { app } from '.'
import { getAuth, type User } from 'firebase/auth'

export const auth = getAuth(app)

/**
 * Firebase resolves the persisted session asynchronously, so loaders that need
 * to know whether someone is signed in have to wait for the first auth state
 * callback rather than reading `auth.currentUser` (null until restore lands).
 */
export function waitForUser(): Promise<User | null> {
	if (auth.currentUser) return Promise.resolve(auth.currentUser)
	return new Promise((resolve, reject) => {
		const unsubscribe = auth.onAuthStateChanged(
			user => {
				unsubscribe()
				resolve(user)
			},
			error => {
				unsubscribe()
				reject(error)
			}
		)
	})
}
