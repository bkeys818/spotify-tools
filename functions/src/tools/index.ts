import * as functions from 'firebase-functions';
import { db } from '../global';
import * as publicLikedSongs from './public-liked-songs';

export const updatePublicLikedSongs = functions
	.runWith({ secrets: ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'] })
	.pubsub.schedule('0 0 * * *')
	.onRun(async () => {
		const docRefs = await db.collection('public-liked-songs').listDocuments();
		return await Promise.all(docRefs.map(publicLikedSongs.update));
	});
