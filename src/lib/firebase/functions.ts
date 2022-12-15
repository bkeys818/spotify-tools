import { app } from '.';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { dev } from '$app/environment';

const functions = getFunctions(app);
if (dev) connectFunctionsEmulator(functions, 'localhost', 5001);

export const authorizeTool = httpsCallable<{
	tool: string;
	code: string;
}>(functions, 'authorizeTool');
