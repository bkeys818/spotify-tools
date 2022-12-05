<script lang="ts">
	import { createAuthorizeURL } from '$lib/spotify';
	import * as cookie from '../cookie';
	import type { PageData } from './$types'
	export let data: PageData;

	function authorize() {
		document.cookie = cookie.spotifyScopes.serialize(data.scopes, document.cookie)
		location.href = createAuthorizeURL(data.scopes);
	}
</script>

<!-- Spotify Logo -->
<p>In order to use our tools, we need limited access to your Spotify account.</p>
<button
	class="bg-gray-200 outline-1 px-3 py-2 rounded-lg"
	on:click={authorize}>Authorize</button
>
