import { app } from '.'
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions'
import { dev } from '$app/environment'
import type * as Tools from '@functions/tools'

const functions = getFunctions(app)
if (dev) connectFunctionsEmulator(functions, 'localhost', 5001)

type Tool = keyof typeof Tools
type Method<T extends Tool> = keyof (typeof Tools)[T]
type HttpsCallable<
	T extends Tool,
	M extends Method<T>
> = (typeof Tools)[T][M] extends Tools.CallableFunction<infer A, infer R>
	? ReturnType<typeof httpsCallable<A, Awaited<R>>>
	: never

export const publicLikedSongs = {
	create: httpsCallable(functions, 'publicLikedSongs-create') satisfies HttpsCallable<
		'publicLikedSongs',
		'create'
	>,
	populate: httpsCallable(functions, 'publicLikedSongs-populate') satisfies HttpsCallable<
		'publicLikedSongs',
		'populate'
	>
}
