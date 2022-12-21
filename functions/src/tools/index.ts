import * as publicLikedSongs from './public-liked-songs'

export async function createPublicLikedSongs(
	ref: FirebaseFirestore.DocumentReference<publicLikedSongs.Data>
) {
	const doc = await ref.get()
	const data = doc.data() as publicLikedSongs.Data

	if (!data.playlist_id) data.playlist_id = await publicLikedSongs.create(data.refresh_token)
	return await publicLikedSongs.update(data.refresh_token, data.playlist_id)
}
