import * as functions from 'firebase-functions';
import { db } from '../global';
import * as publicLikedSongs from './public-liked-songs';

export const updateAllPublicLikedSongs = functions
	.runWith({ secrets: ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'] })
	.pubsub.schedule('0 0 * * *')
	.onRun(async () => {
		const docRefs = await db.collection('public-liked-songs').listDocuments();
		return await Promise.all(
			docRefs.map(async (ref) => {
				const doc = await ref.get();
				const data = doc.data() as publicLikedSongs.Data;
				if (data.playlist_id)
					return await publicLikedSongs.update(data.refresh_token, data.playlist_id);
			})
		);
	});
