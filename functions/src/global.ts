import * as admin from 'firebase-admin'

export const db = admin.firestore()

export function handleResponse<T>(call: () => Promise<Response<T>>): Promise<T> {
	return call()
		.catch(error => {
			throw `Spotify Error: ${error}`
		})
		.then(res => {
			if (res.statusCode < 300) {
				return res.body
			} else {
				// handle error
				throw `Spotify Error: ${res.statusCode}`
			}
		})
}

interface Response<T> {
	body: T
	headers: Record<string, string>
	statusCode: number
}
