<script lang="ts">
	import { path } from '.'
	import AuthSpotify from '$lib/components/AuthSpotify.svelte'
	import PlaylistList from '$lib/components/spotify/PlaylistGrid.svelte'
</script>

<div class="my-4 text-center">
	<AuthSpotify {path} scopes="user-library-modify playlist-modify-private" let:token>
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
