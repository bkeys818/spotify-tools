<script lang="ts">
	import { onMount } from 'svelte'
	import { user } from '$lib/stores'
	import { authorize } from '$lib/spotify'
	import { setCookie } from '$lib/cookie'

	export let firebase = false
	export let spotify = false

	let url: string

	onMount(() => {
		if (firebase) url = '/login?redirect=' + encodeURIComponent(location.pathname)
	})
</script>

{#if firebase && !$user}
	{#if $user === undefined}
		<!-- loading state -->
	{:else if $user == null}
		<a href={url} class="btn-primary">Login</a>
		<p class="mt-4">Log in to use our tools</p>
	{/if}
{:else if spotify}
	<button
		class="btn-primary"
		on:click={() => {
			setCookie('directed_from_path', location.pathname)
			authorize('user-library-read playlist-modify-public')
		}}>Authorize</button
	>
	<p class="mt-4">In order to use our tools, we need limited access to your Spotify account.</p>
{:else}
	<slot />
{/if}
