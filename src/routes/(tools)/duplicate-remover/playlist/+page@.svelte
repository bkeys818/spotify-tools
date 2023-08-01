<script lang="ts">
	import { path } from '..'
	import { onMount } from 'svelte'
	import { getPlaylistTracks, type TrackObj } from '$lib/spotify'
	import { findDuplicates } from '.'
	import AuthSpotify from '$lib/components/AuthSpotify.svelte'
	import CheckBox from '$lib/components/CheckBox.svelte'
	import Track from './Track.svelte'

	let playlistName = ''
	let playlistId: string
	let playlistCoverSrc: string
	let duplicates: Record<string, string[]> = {}
	const trackMap: Record<string, TrackObj> = {}
	const trackSelected: Record<string, boolean> = {}
	let selectedGroupId: string | undefined = undefined

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

	async function getDuplicates(token: string) {
		const tracks = await getPlaylistTracks(token, playlistId)
		duplicates = findDuplicates(tracks, trackMap)
		for (const id in duplicates) trackSelected[id] = false
	}
</script>

<svelte:head>
	<title>Remove Duplicates - {playlistName}</title>
</svelte:head>

<AuthSpotify {path} scopes="user-library-modify playlist-modify-private" let:token>
	<div class="flex items-end my-4">
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
		<div class="row h-8 border-b border-b-neutral-600 !rounded-none">
			<p class="text-right mb-0 text-sm text-neutral-600">#</p>
			<p class="mb-0 text-sm text-neutral-600">Track & Artist(s)</p>
			<p class="mb-0 text-sm text-neutral-600">Album</p>
			<div class="mx-3" />
		</div>
		{#await getDuplicates(token) then}
			{#each Object.values(trackMap).sort((a, b) => a.index - b.index) as track}
				<div
					class="track-group"
					class:selected={track.id == selectedGroupId}
					class:disabled={trackSelected[track.id]}
					style={`--duplicate-count: ${duplicates[track.id].length}`}
				>
					<div
						class="row cursor-pointer"
						on:click={() => {
							selectedGroupId = selectedGroupId == track.id ? undefined : track.id
						}}
					>
						<p class="text-right mb-0.5">{track.index + 1}</p>
						<Track {track} />
						<p class="text-center mb-0">
							{duplicates[track.id].length}
						</p>
					</div>
					{#each duplicates[track.id] as duplicateId, index}
						<div
							class="row duplicate cursor-pointer !pl-4"
							style={`--index: ${index}`}
							on:click={() => {
								trackSelected[duplicateId] = !trackSelected[duplicateId]
							}}
						>
							<div class="!mr-auto">
								<CheckBox
									id={track.id}
									size="sm"
									bind:checked={trackSelected[duplicateId]}
								/>
							</div>
							<Track track={trackMap[duplicateId]} />
						</div>
					{/each}
				</div>
			{/each}
		{/await}
	</div>
</AuthSpotify>

<style lang="postcss">
	.row {
		@apply grid items-center rounded bg-inherit px-2 hover:bg-slate-50;
		grid-template-columns: 28px minmax(0, 4fr) minmax(0, 3fr) 36px;
		transition: background-color 0.2s ease-in-out;
		& :global(> *) {
			@apply mr-4;
		}
		& > *:last-child {
			@apply mr-0;
		}
	}
	.track-group {
		--track-hieght: 3.5rem;
		@apply relative bg-white;
		height: var(--track-hieght);
		transition: height 0.4s ease-in-out;

		.row {
			height: var(--track-hieght);
		}

		.duplicate {
			@apply opacity-0 top-0;
			transition: top 0.4s ease-in-out, opacity 0.4s ease-in-out;
		}

		&.disabled .row {
			@apply cursor-not-allowed hover:bg-inherit;
			& :global(p), :global(img) {
				@apply opacity-50;
			}
		}

		&.selected {
			height: calc(var(--track-hieght) * (var(--duplicate-count) + 1));
			@apply rounded bg-slate-100;
			> .row {
				@apply border-b border-b-neutral-600 rounded-b-none;
			}
			.row {
				@apply hover:bg-slate-200;
			}
			.duplicate {
				@apply opacity-100;
				top: calc((var(--index) + 1) * var(--track-hieght));
			}
		}
	}
	.row {
		@apply grid items-center rounded bg-inherit px-2;
		grid-template-columns: 28px minmax(0, 4fr) minmax(0, 3fr) 36px;
		& :global(> *) {
			@apply mr-4;
		}
		& > *:last-child {
			@apply mr-0;
		}
	}
	.row {
		@apply hover:bg-slate-50;
		transition: background-color 0.2s ease-in-out;
		height: var(--track-hieght);
	}
</style>
