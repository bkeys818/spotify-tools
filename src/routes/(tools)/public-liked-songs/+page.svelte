<script lang="ts">
	import { onMount } from 'svelte'
	import { createPublicLikedSongs } from '$lib/firebase/functions'
	import { user } from '$lib/stores'
	import AuthorizeButton from '$lib/components/AuthorizeButton.svelte'
	import LoginButton from '$lib/components/LoginButton.svelte'
	import Spinner from '$lib/components/spinner.svelte'
	import SpotifyEmbed from '$lib/components/spotify-embed.svelte'
	import ErrorMsg from '$lib/components/ErrorMsg.svelte'

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

<div class="my-4 text-center">
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
			<ErrorMsg {error} />
		{/await}
	{:else if $user}
		<AuthorizeButton />
	{:else}
		<LoginButton />
	{/if}
</div>
