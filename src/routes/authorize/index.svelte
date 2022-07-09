<script context="module" lang="ts">
	import type { Load } from './__types';
	export const load: Load = ({ url }) => {
		const scopes = url.searchParams.get('scopes')?.split(' ') ?? [];
		return { props: { scopes } };
	};
</script>

<script lang="ts">
	import { createAuthorizeURL } from '$lib/spotify';
	import * as cookie from '../_cookie';
	import { base } from '$app/paths';

	export let scopes: string[];

	function authorize() {
		document.cookie = cookie.spotifyScopes.serialize(scopes, document.cookie)
		location.href = createAuthorizeURL(scopes);
	}
</script>

<!-- Spotify Logo -->
<p>In order to use our tools, we need limited access to your Spotify account.</p>
<button
	class="bg-gray-200 outline-1 px-3 py-2 rounded-lg"
	on:click={authorize}>Authorize</button
>
