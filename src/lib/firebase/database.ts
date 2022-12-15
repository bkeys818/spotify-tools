import { app } from '.';
import { getFirestore, connectFirestoreEmulator, setDoc, doc } from 'firebase/firestore';
import { dev } from '$app/environment'

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);
if (dev) connectFirestoreEmulator(db, 'localhost', 8080);

export function setDataFor<T extends keyof Tools>(tool: T, userId: string, data: Partial<Tools[T]>) {
	return setDoc(doc(db, tool, userId), data, { merge: true });
}

interface Tools {
	'public-liked-songs'?: PublicLikedSongs;
}

interface Tool {
	refresh_token: string;
}

interface PublicLikedSongs extends Tool {
	playlist_id: string;
}