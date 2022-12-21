<script lang="ts">
	import { navigateToAuthorize } from '../../authorize/link'
	import { onMount } from 'svelte'
	import { authorizeTool } from '$lib/firebase/functions'
	import Spinner from '$lib/components/spinner.svelte'
	import SpotifyEmbed from '$lib/components/spotify-embed.svelte'

	let backendResponse: ReturnType<typeof authorizeTool> | undefined

	onMount(async () => {
		const searchParams = new URLSearchParams(location.search.slice(1))
		const code = searchParams.get('code')
		// check state
		if (code) {
			const tool = location.pathname.slice(location.pathname.lastIndexOf('/') + 1)
			backendResponse = authorizeTool({ code, tool, origin: location.origin })
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
	{:else}
		<div />
		<!-- Spotify Logo -->
		<button
			class="bg-gray-200 outline-1 px-3 py-2 rounded-lg"
			on:click={() => {
				navigateToAuthorize(['user-library-read', 'playlist-modify-public'])
			}}>Authorize</button
		>
		<p>In order to use our tools, we need limited access to your Spotify account.</p>
	{/if}
</div>
