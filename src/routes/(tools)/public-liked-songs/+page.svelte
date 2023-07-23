<script lang="ts">
	import { onMount } from 'svelte'
	import { publicLikedSongs } from '$lib/firebase/functions'
	import { user } from '$lib/stores'
	import AuthorizeButton from '$lib/components/AuthorizeButton.svelte'
	import LoginButton from '$lib/components/LoginButton.svelte'
	import Spinner from '$lib/components/spinner.svelte'
	import SpotifyEmbed from '$lib/components/spotify-embed.svelte'
	import ErrorMsg from '$lib/components/ErrorMsg.svelte'

	let createResponse: ReturnType<(typeof publicLikedSongs)['create']> | undefined
	let isPopulated = false

	onMount(() => {
		const searchParams = new URLSearchParams(location.search.slice(1))
		const code = searchParams.get('code')
		if (code) {
			createAndPopulate(code)
			history.replaceState({}, document.title, location.pathname)
		}
	})

	async function createAndPopulate(code: string) {
		createResponse = publicLikedSongs.create({ code, origin: location.origin })
		const {
			data: { userId }
		} = await createResponse
		await publicLikedSongs.populate({ userId, origin: location.origin })
		isPopulated = true
	}
</script>

<div class="my-4 text-center">
	{#if createResponse}
		{#await createResponse}
			<Spinner />
		{:then { data: { playlistId } }}
			<SpotifyEmbed
				title="public-liked-songs"
				type="playlist"
				id={playlistId}
				className="mx-auto"
			/>
			{#if isPopulated}
				<p>Playlist synced!</p>
			{:else}
				<p class="loading">Populating playlist</p>
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
