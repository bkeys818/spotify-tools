import { app } from '.'
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions'
import { dev } from '$app/environment'

const functions = getFunctions(app)
if (dev) connectFunctionsEmulator(functions, 'localhost', 5001)

export const createPublicLikedSongs = httpsCallable<{
	code: string
	origin: string
}, { playlistId: string, userId: string }>(functions, 'publicLikedSongs-create')

export const populatePublicLikedSongs = httpsCallable<{
	userId: string
	origin: string
}>(functions, 'publicLikedSongs-create')