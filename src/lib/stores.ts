import { readable } from 'svelte/store'
import { auth } from '$lib/firebase/auth'
import type { User } from 'firebase/auth'

export const user = readable<User | null | undefined>(undefined, set =>
	auth.onAuthStateChanged(set)
)
