<script lang="ts">
	import { onMount } from 'svelte'
	import { createTokenStore } from '$lib/stores'
	import AuthSpotifyButton from './AuthSpotifyButton.svelte'

	export let scopes: string | undefined = undefined
	export let path: string
	let token = createTokenStore(path)

	onMount(() => {
		token.check()
	})
</script>

{#if $token === undefined}
	<!-- loading state -->
{:else if $token == null}
	<AuthSpotifyButton authType="token" {scopes} />
{:else}
	<slot token={`${$token}`} />
{/if}
