<script context="module" src>
	const id = 'duplicate-remover'
	export const path = './' + id
</script>

<script lang="ts">
	import toolInfo from '../info.json'
	import ToolHeader from '$lib/components/ToolHeader.svelte'
	import AuthSpotify from '$lib/components/AuthSpotify.svelte'
	import PlaylistList from '$lib/components/spotify/PlaylistGrid.svelte'
</script>

<ToolHeader info={toolInfo[id]} />

<div class="my-4 text-center">
	<AuthSpotify {path} scopes="playlist-modify-public playlist-modify-private" let:token>
		<PlaylistList
			{token}
			playlistLink={({ name, id, images }) => {
				const image = images[0].url
				return `${location.pathname}/playlist?${new URLSearchParams({
					name,
					id,
					image
				}).toString()}`
			}}
		/>
	</AuthSpotify>
</div>
