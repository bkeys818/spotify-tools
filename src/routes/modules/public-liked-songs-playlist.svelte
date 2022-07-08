<script lang="ts">
	import { navigateToLogin } from '../login/_link';
	const requredScopes = ['user-library-read', 'playlist-modify-public'];
	export const accessToken: string | undefined = undefined;
	export const isAuthenticated: boolean = false;
</script>

<h2>Public "Liked Songs" Playlist</h2>
<p>
	Creates a public paylist that contains all your liked songs. Then updates that playlist every day.
	This allows your people who follow you to see and play your liked songs.
</p>
<button
	class="bg-gray-200 outline-1 disabled:bg-gray-600 px-3 py-2 rounded-lg"
	disabled={isAuthenticated}
	on:click={() => { navigateToLogin(requredScopes) }}
	>Authenticate</button
>
