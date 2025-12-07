<script lang="ts">
	import type { TrackObj } from '$lib/spotify'
	export let track: TrackObj

	const albumCoverSrc =
		track.album.images.length > 0
			? track.album.images.length == 1
				? track.album.images[0].url
				: track.album.images[2].url
			: undefined
</script>

<div class="flex gap-4" title={track.id}>
	<img
		src={albumCoverSrc}
		alt={track.album.name + ' album cover'}
		width="40"
		height="40"
		class="hidden md:block object-cover h-[40px]"
	/>
	<div class="min-w-0">
		<p class="whitespace-nowrap overflow-hidden text-ellipsis mb-0">
			{track.name}
		</p>
		<p class="whitespace-nowrap overflow-hidden text-ellipsis mb-0 text-sm text-neutral-600">
			{track.artists.map(artist => artist.name).join(', ')}
		</p>
	</div>
</div>
<p class="whitespace-nowrap overflow-hidden text-ellipsis mb-0 text-neutral-600">
	{track.album.name}
</p>
