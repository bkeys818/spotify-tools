<script lang="ts">
	import { onMount } from 'svelte'
	import { createTokenStore } from '$lib/stores'
	import AuthSpotifyButton from './AuthSpotifyButton.svelte'
	import ErrorMsg from '$lib/components/ErrorMsg.svelte'

	export let scopes: string | undefined = undefined
	export let path: string
	let token = createTokenStore(path)

	let error: unknown

	onMount(() => {
		token.check()
	})
</script>

{#if $token === undefined}
	<!-- loading state -->
{:else if $token == null}
	<AuthSpotifyButton authType="token" {scopes} />
	{#if error}
		<ErrorMsg error />
	{/if}
{:else}
	<slot token={`${$token}`} />
{/if}
