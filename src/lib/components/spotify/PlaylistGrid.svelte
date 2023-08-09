<script lang="ts">
	import { getMe, getMyPlaylists } from '$lib/spotify'
	import type { ComponentProps } from 'svelte'
	import ErrorMsg from '$lib/components/ErrorMsg.svelte'
	import Playlist from '$lib/components/spotify/PlaylistPreview.svelte'

	export let playlistLink: ComponentProps<Playlist>['link'] = undefined
	export let token: string

	const playlistsPromise = getPlaylists()

	async function getPlaylists() {
		const { id } = await getMe(token)
		const playlist = await getMyPlaylists(token)
		return playlist.filter(p => p.owner.id === id && p.tracks.total > 0)
	}
</script>

<div class="playlistGrid">
	{#await playlistsPromise}
		<!-- eslint-disable-next-line @typescript-eslint/no-unused-vars -->
		{#each { length: 8 } as _}
			<Playlist link={playlistLink} />
		{/each}
	{:then playlists}
		{#each playlists as playlist (playlist.id)}
			<Playlist {playlist} link={playlistLink} />
		{/each}
	{/await}
</div>
{#await playlistsPromise catch error}
	<ErrorMsg {error} />
{/await}

<style>
	.playlistGrid {
		display: grid;
		grid-template: auto/repeat(auto-fill, minmax(max(280px, 25%), 1fr));
		gap: 16px 24px;
	}
</style>
