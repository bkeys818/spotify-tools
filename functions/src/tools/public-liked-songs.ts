import { handleResponse } from '../global';
import SpotifyWebApi from 'spotify-web-api-node';

export async function update(
	ref: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>
) {
	// get data from document
	const doc = await ref.get();
	const data = doc.data();
	if (!data) return;
	const { playlist_id, refresh_token } = data;

	// authorize
	const spotify = new SpotifyWebApi({
		clientId: process.env.SPOTIFY_CLIENT_ID,
		clientSecret: process.env.SPOTIFY_CLIENT_SECRET
	});
	spotify.setRefreshToken(refresh_token);
	const { access_token } = await handleResponse(() => spotify.refreshAccessToken());
	spotify.setAccessToken(access_token);

	const [playlistTracks, savedTracks] = await Promise.all([
		getPlaylistTracks(spotify, playlist_id),
		getSavedTracks(spotify)
	]);

	const removedTracks = playlistTracks.filter(
		(track) => !savedTracks.some((savedTrack) => savedTrack.id === track.id)
	);
	const addedTracks = savedTracks.filter(
		(track) => !playlistTracks.some((playlistTrack) => playlistTrack.id === track.id)
	);

	const updateMethods: Parameters<typeof handleResponse>[0][] = [];
	if (removedTracks.length > 0)
		updateMethods.push(() => spotify.removeTracksFromPlaylist(playlist_id, removedTracks));
	if (addedTracks.length > 0)
		updateMethods.push(() =>
			spotify.addTracksToPlaylist(
				playlist_id,
				addedTracks.map((track) => track.uri)
			)
		);

	await Promise.all(updateMethods.map(handleResponse));
}

async function getPlaylistTracks(spotify: SpotifyWebApi, playlistId: string) {
	const items: SpotifyApi.PlaylistTrackObject[] = [];
	let total = 1;
	while (items.length < total) {
		const response = await handleResponse(() =>
			spotify.getPlaylistTracks(playlistId, {
				limit: 50,
				offset: items.length
			})
		);
		total = response.total;
		items.push(...response.items);
	}
	return items
		.map((item) => item.track)
		.filter((item): item is SpotifyApi.TrackObjectFull => Boolean(item));
}

async function getSavedTracks(spotify: SpotifyWebApi) {
	const items: SpotifyApi.SavedTrackObject[] = [];
	let total = 1;
	while (items.length < total) {
		const response = await handleResponse(() =>
			spotify.getMySavedTracks({ limit: 50, offset: items.length })
		);
		total = response.total;
		items.push(...response.items);
	}
	return items.map((item) => item.track);
}
