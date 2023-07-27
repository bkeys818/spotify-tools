<script lang="ts">
	import { path } from '.'
	import type { TokenStore } from '$lib/stores'
	import AuthSpotify from '$lib/components/AuthSpotify.svelte'

	let token: TokenStore
</script>

<div class="my-4 text-center">
	<AuthSpotify {path} scopes="user-library-modify playlist-modify-private" bind:token />
</div>
