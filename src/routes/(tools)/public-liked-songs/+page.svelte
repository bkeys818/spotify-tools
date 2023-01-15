<script lang="ts">
	import type { PageData } from './$types'
	import { authorize } from '$lib/spotify'
	import { setCookie } from '$lib/cookie'
	import { onMount } from 'svelte'
	import { createPublicLikedSongs } from '$lib/firebase/functions'
	import { user } from '$lib/stores'
	import Spinner from '$lib/components/spinner.svelte'
	import SpotifyEmbed from '$lib/components/spotify-embed.svelte'

	export let data: PageData
	let backendResponse: ReturnType<typeof createPublicLikedSongs> | undefined

	onMount(async () => {
		const searchParams = new URLSearchParams(location.search.slice(1))
		const code = searchParams.get('code')
		if (code) {
			backendResponse = createPublicLikedSongs({ code, origin: location.origin })
			history.replaceState({}, document.title, location.pathname)
		}
	})
</script>

<div class="my-4">
	{#if backendResponse}
		{#await backendResponse}
			<Spinner />
		{:then result}
			{#if typeof result.data == 'string'}
				<SpotifyEmbed
					title="public-liked-songs"
					type="playlist"
					id={result.data}
					className="mx-auto"
				/>
			{/if}
		{:catch error}
			<p>Oh No! Something went wrong</p>
			<p>{error}</p>
		{/await}
	{:else if $user}
		<div />
		<!-- Spotify Logo -->
		<button
			class="bg-gray-200 outline-1 px-3 py-2 rounded-lg"
			on:click={() => {
				setCookie('directed_from_path', location.pathname)
				authorize('user-library-read playlist-modify-public')
			}}>Authorize</button
		>
		<p>In order to use our tools, we need limited access to your Spotify account.</p>
	{:else}
		<a href={data.loginUrl} class="bg-gray-200 outline-1 px-3 py-2 rounded-lg">Login</a>
		<p>Log in to use our tools</p>
	{/if}
</div>