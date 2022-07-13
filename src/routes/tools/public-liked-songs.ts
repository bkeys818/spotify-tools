import type { RequestHandler } from './__types/public-liked-songs';
import * as cookie from '../_cookie';
import SpotifyWebApi from 'spotify-web-api-node';
import { setDataFor } from '$lib/firebase/database'

export const post: RequestHandler = async ({ request }) => {
	const accessToken = cookie.spotifyAccessToken.parse(request.headers.get('cookie') ?? '');
	if (!accessToken) return { status: 401 };

	const spotify = new SpotifyWebApi({ accessToken });
	const [user, tracks, playlist] = await Promise.all([
		spotify.getMe(),
		getAllMySavedTracks(spotify),
		spotify.createPlaylist('Liked Songs (Public)', {
			public: true,
			description: 'Created at "benkeys.com/spotify/tools".'
		})
	]);

	setDataFor('public-liked-songs', user.body.id, { playlist_id: playlist.body.id })

	const maxTracks = 100;
	for (let i = 0; i < tracks.length; i += maxTracks) {
		await spotify.addTracksToPlaylist(
			playlist.body.id,
			tracks.slice(i, i + maxTracks).map((track) => track.track.uri)
		);
	}

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
