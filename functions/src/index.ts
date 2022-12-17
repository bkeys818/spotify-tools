import * as admin from 'firebase-admin';
admin.initializeApp();
import * as functions from 'firebase-functions';
import * as authorize from './authorize'
import * as toolFunctions from './tools';

export const authorizeTool = functions
	.runWith({ secrets: ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'] })
	.https.onCall(async (data: { tool: string, code: string }) => {
		return await authorize.authorizeTool(data.tool, data.code)
	})

export const tools = toolFunctions
