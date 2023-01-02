import * as publicLikedSongs from './public-liked-songs'

export async function createPublicLikedSongs(
	ref: FirebaseFirestore.DocumentReference<publicLikedSongs.Data>
) {
	const doc = await ref.get()
	const data = doc.data() as publicLikedSongs.Data

	if (!data.playlist_id) {
		data.playlist_id = await publicLikedSongs.create(data.refresh_token)
		await ref.update({ playlist_id: data.playlist_id })
	}
	try {
		return await publicLikedSongs.update(data.refresh_token, data.playlist_id)
	} catch (error) {
		if (typeof error == 'object' && error && 'statusCode' in error)
			if ((error as { statusCode: unknown }).statusCode == 404)
				return await ref.update({ playlist_id: undefined })
		throw error
	}
}
