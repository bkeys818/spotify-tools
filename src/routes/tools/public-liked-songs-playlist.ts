import type { RequestHandler } from './__types/public-liked-songs-playlist';
import * as cookie from '../_cookie';
import SpotifyWebApi from 'spotify-web-api-node';

export const post: RequestHandler = async ({ request }) => {
	const accessToken = cookie.spotifyAccessToken.parse(request.headers.get('cookie') ?? '');
	if (!accessToken) return { status: 401 };

	const spotify = new SpotifyWebApi({ accessToken });
	const [tracks, playlist] = await Promise.all([
		getAllMySavedTracks(spotify),
		spotify.createPlaylist('Liked Songs (Public)', {
			public: true,
			description: 'Created at "benkeys.com/spotify/tools".'
		})
	]);
	await spotify.addTracksToPlaylist(
		playlist.body.id,
		tracks.map((track) => track.track.uri)
	);

	return {
		status: 200,
		body: { playlist: playlist.body.external_urls.spotify }
	};
};

async function getAllMySavedTracks(spotify: SpotifyWebApi) {
	const tracks: SpotifyApi.SavedTrackObject[] = [];
	let total = 1;
	while (tracks.length < total) {
		const response = await spotify.getMySavedTracks({ limit: 50, offset: tracks.length });
		total = response.body.total;
		tracks.push(...response.body.items);
	}
	return tracks;
}
