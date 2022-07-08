<script context="module" lang="ts">
	import type { Load } from './__types';
	export const load: Load = ({ url }) => {
		const scopes = url.searchParams.get('scopes')?.split(' ');
		return { props: { scopes } };
	};
</script>

<script lang="ts">
	import { createAuthorizeURL } from '$lib/spotify';

	export const scopes: string[] = [];
</script>

<!-- Spotify Logo -->
<p>In order to use our tools, we need limited access to your Spotify account.</p>
<button class="bg-gray-200 outline-1 px-3 py-2 rounded-lg" on:click={() => {
	createAuthorizeURL(scopes)
}}>Authorize</button>