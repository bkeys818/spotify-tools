import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from 'firebase/auth'
import { auth } from '@/lib/firebase/auth'

/**
 * Replaces the `user` readable store. Three states are load-bearing:
 *   undefined - still resolving   null - signed out   User - signed in
 * `AuthFirebase` renders nothing at all while undefined.
 */
const UserContext = createContext<User | null | undefined>(undefined)

export function UserProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null | undefined>(undefined)

	// onAuthStateChanged returns its own unsubscriber, which was the Svelte
	// store's stop callback and is now the effect teardown.
	useEffect(() => auth.onAuthStateChanged(setUser), [])

	return <UserContext value={user}>{children}</UserContext>
}

export function useUser() {
	return useContext(UserContext)
}
