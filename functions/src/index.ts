import * as admin from 'firebase-admin';
admin.initializeApp();
import * as functions from 'firebase-functions';
import { db } from './global';
import * as authorize from './authorize'
import { updatePublicLikedSongs } from './public-liked-songs';

export const authorizeTool = functions
	.runWith({ secrets: ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'] })
	.https.onCall(async (data: { tool: string, code: string }) => {
		return await authorize.authorizeTool(data.tool, data.code)
	})

export const updatePublicLikedSongsPlaylists = functions
	.runWith({ secrets: ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'] })
	.pubsub.schedule('0 0 * * *')
	.onRun(async () => {
		const docRefs = await db.collection('public-liked-songs').listDocuments();
		return await Promise.all(docRefs.map(updatePublicLikedSongs));
	});
