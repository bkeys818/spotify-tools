<script context="module" lang="ts">
	import { sessionIsAuthorized } from '$lib/spotify';
	import type { Load } from './__types/public-liked-songs';
	const requredScopes = ['user-library-read', 'playlist-modify-public'];
	export const load: Load = ({ session }) => ({
		props: {
			isAuthenticated: sessionIsAuthorized(session, ['user-library-read', 'playlist-modify-public'])
		}
	});
</script>

<script lang="ts">
	import { navigateToAuthorize } from '../authorize/_link';
	export let isAuthenticated: boolean;
	let playlist: string | undefined = undefined;
</script>

<!-- <h2>Public "Liked Songs" Playlist</h2>
<p>
	Creates a public paylist that contains all your liked songs. Then updates that playlist every day.
	This allows your people who follow you to see and play your liked songs.
</p> -->
<p>{isAuthenticated}</p>
<button
	class="bg-gray-200 outline-1 disabled:bg-gray-600 px-3 py-2 rounded-lg"
	disabled={isAuthenticated}
	on:click={() => {
		navigateToAuthorize(requredScopes);
	}}>Authenticate</button
>
<button
	class="bg-gray-200 outline-1 disabled:bg-gray-600 px-3 py-2 rounded-lg"
	disabled={!isAuthenticated}
	on:click={() => {
		console.log('clicked');
		fetch('./public-liked-songs', { method: 'POST', headers: { 'accept': 'application/json' } })
			.then(res => res.json())
			.then(json => { playlist = json.playlist })
			.catch(console.error);
	}}>Create Playlist</button
>
{#if playlist}
	<a href={playlist}>New Playlist!</a>
{/if}
