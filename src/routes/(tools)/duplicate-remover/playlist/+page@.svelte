<script lang="ts">
	import { path } from '..'
	import { onMount } from 'svelte'
	import { getPlaylistTracks } from '$lib/spotify'
	import AuthSpotify from '$lib/components/AuthSpotify.svelte'

	let playlistName: string = ''
	let playlistId: string
	let playlistCoverSrc: string
	let tracks: Awaited<ReturnType<typeof getPlaylistTracks>> = []

	onMount(() => {
		const params = new URLSearchParams(location.search)
		const name = params.get('name'),
			id = params.get('id'),
			image = params.get('image')
		if (!name || !id || !image)
			location.href = location.pathname.slice(0, location.pathname.lastIndexOf('/'))
		else {
			playlistName = name
			playlistId = id
			playlistCoverSrc = image
		}
	})

	async function getTracks(token: string) {
		tracks = await getPlaylistTracks(token, playlistId)
	}
</script>

<svelte:head>
	<title>Remove Duplicates - {playlistName}</title>
</svelte:head>

<AuthSpotify {path} scopes="user-library-modify playlist-modify-private" let:token>
	<div class="flex items-end">
		<div class="hidden md:block md:w-32 md:h-32 md:rounded">
			<img
				class="object-cover h-full"
				src={playlistCoverSrc}
				alt={playlistName + ' playlist cover image'}
			/>
		</div>
		<h2 class="text-left text-4xl md:pl-4 lg:pl-6">{playlistName}</h2>
	</div>
	<div>
		{#await getTracks(token) then}
			{#each tracks as track}
				{@const albumCoverSrc =
					track.album.images.length > 0
						? track.album.images.length == 1
							? track.album.images[0].url
							: track.album.images[2].url
						: undefined}
				<div
					class="grid grid-cols-[40px_minmax(0,4fr)_minmax(0,3fr)_80px] h-14 gap-3 items-center"
				>
					<img
						src={albumCoverSrc}
						alt={track.album.name + ' album cover'}
						width="40"
						height="40"
						class="hidden md:block object-cover h-[40px]"
					/>
					<div>
						<p class="whitespace-nowrap overflow-hidden text-ellipsis mb-0">
							{track.name}
						</p>
						<p
							class="whitespace-nowrap overflow-hidden text-ellipsis mb-0 text-sm text-neutral-600"
						>
							{track.artists.map(artist => artist.name).join(' ,')}
						</p>
					</div>
					<p
						class="whitespace-nowrap overflow-hidden text-ellipsis mb-0 text-neutral-600"
					>
						{track.album.name}
					</p>
				</div>
			{/each}
		{/await}
	</div>
</AuthSpotify>
