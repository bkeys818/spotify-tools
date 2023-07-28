<script lang="ts">
	// eslint-disable-next-line no-undef
	export let playlist: SpotifyApi.PlaylistObjectSimplified | undefined = undefined

	// eslint-disable-next-line no-undef
	function getPhoto(images: SpotifyApi.ImageObject[]) {
		if (images.length == 1) return images[0].url // 640x640
		else return images[1].url // 300x300
	}
</script>

<a
	href={playlist ? location.pathname + '/playlist?id=' + playlist.id : undefined}
	class:loading={!playlist}
	class="flex bg-[#0000001a] rounded h-20"
>
	<div class="playlistImage">
		{#if playlist}
			<img
				src={getPhoto(playlist.images)}
				alt={`"${playlist.name}" playlist cover`}
				height="80"
				width="80"
				class="object-cover h-20 rounded-l"
			/>
		{/if}
	</div>
	<div class="flex items-center">
		<p class="px-4 mb-0 text-left">{playlist?.name ?? ''}</p>
	</div>
</a>
