<script lang="ts">
	/* eslint-disable no-undef */
	export let playlist: SpotifyApi.PlaylistObjectSimplified | undefined = undefined
	export let link = (playlist: SpotifyApi.PlaylistObjectSimplified) =>
		location.pathname + '/playlist?id=' + playlist.id

	function getPhoto(images: SpotifyApi.ImageObject[]) {
		if (images.length == 1) return images[0].url // 640x640
		else return images[1].url // 300x300
	}
	/*  eslint-enable no-undef */
</script>

<a
	href={playlist ? link(playlist) : undefined}
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
