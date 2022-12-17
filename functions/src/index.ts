import * as admin from 'firebase-admin';
admin.initializeApp();
import * as functions from 'firebase-functions';
import * as authorize from './authorize'
import * as toolFunctions from './tools';
import * as scheduledToolFunctions from './tools/scheduled';

const toolFunctionKeys: Record<string, keyof typeof toolFunctions> = {
	'public-liked-songs': 'createPublicLikedSongs'
}

export const authorizeTool = functions
	.runWith({ secrets: ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'] })
	.https.onCall(async (data: { tool: string, code: string }) => {
		const ref = await authorize.authorizeTool(data.tool, data.code)
		if (data.tool in toolFunctionKeys)
			await toolFunctions[toolFunctionKeys[data.tool]](ref)
	})

export const toolsScheduled = scheduledToolFunctions
