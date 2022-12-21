import * as publicLikedSongs from './public-liked-songs'

export async function createPublicLikedSongs(
	ref: FirebaseFirestore.DocumentReference<publicLikedSongs.Data>
) {
	const doc = await ref.get()
	let { refresh_token, playlist_id } = doc.data() as publicLikedSongs.Data

	if (!playlist_id) playlist_id = await publicLikedSongs.create(refresh_token)
	return await publicLikedSongs.update(refresh_token, playlist_id)
}
