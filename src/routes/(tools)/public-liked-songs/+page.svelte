<script lang="ts">
	import { onMount } from 'svelte'
	import { publicLikedSongs } from '$lib/firebase/functions'
	import { parseCode } from '$lib/spotify'
	import AuthFirebase from '$lib/components/AuthFirebase.svelte'
	import AuthSpotifyButton from '$lib/components/AuthSpotifyButton.svelte'
	import Spinner from '$lib/components/spinner.svelte'
	import SpotifyEmbed from '$lib/components/spotify-embed.svelte'
	import ErrorMsg from '$lib/components/ErrorMsg.svelte'

	let playlistId: Promise<string> | undefined
	let isPopulated: boolean | undefined = false
	let error: unknown

	onMount(() => {
		try {
			const code = parseCode()
			if (code) {
				playlistId = create(code)
			}
		} catch (err) {
			error = err
		}
	})

	async function create(code: string) {
		const { data } = await publicLikedSongs.create({ code, origin: location.origin })
		populate(data.userId)
		return data.playlistId
	}

	async function populate(userId: string) {
		try {
			await publicLikedSongs.populate({ userId: userId, origin: location.origin })
			isPopulated = true
		} catch (err) {
			isPopulated = undefined
			error = err
		}
	}
</script>

<div class="my-4 text-center">
	<AuthFirebase>
		{#if !playlistId}
			<AuthSpotifyButton authType="code" scopes="user-library-read playlist-modify-public" />
		{:else}
			{#await playlistId}
				<Spinner />
			{:then playlistId}
				<SpotifyEmbed
					title="public-liked-songs"
					type="playlist"
					id={playlistId}
					className="mx-auto"
				/>
				{#if isPopulated === true}
					<p>Playlist synced!</p>
				{:else if isPopulated === false}
					<p class="loading">Populating playlist</p>
				{/if}
			{:catch error}
				<ErrorMsg {error} />
			{/await}
			{#if error}
				<ErrorMsg {error} />
			{/if}
		{/if}
	</AuthFirebase>
</div>
