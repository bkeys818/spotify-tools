import * as admin from 'firebase-admin';
admin.initializeApp();
import * as functions from 'firebase-functions';
import * as authorize from './authorize';
import * as toolFunctions from './tools';
import * as scheduledToolFunctions from './tools/scheduled';

const toolFunctionKeys: Record<string, keyof typeof toolFunctions> = {
	'public-liked-songs': 'createPublicLikedSongs'
};

type Result = Awaited<
	ReturnType<typeof toolFunctions[typeof toolFunctionKeys[keyof typeof toolFunctionKeys]]>
>;
export const authorizeTool = functions
	.runWith({ secrets: ['SPOTIFY_CLIENT_ID', 'SPOTIFY_CLIENT_SECRET'] })
	.https.onCall(
		async (data: {
			tool: string;
			code: string;
			origin: string;
		}): Promise<Result | undefined> => {
			const ref = await authorize.authorizeTool(data.tool, data.code, data.origin);
			if (data.tool in toolFunctionKeys) {
				return toolFunctions[toolFunctionKeys[data.tool]](ref);
			} else return;
		}
	);

export const toolsScheduled = scheduledToolFunctions;
