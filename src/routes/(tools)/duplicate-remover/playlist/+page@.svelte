<script lang="ts">
	import { path } from '..'
	import { onMount } from 'svelte'
	import { getPlaylistTracks, type TrackObj } from '$lib/spotify'
	import { sessioned } from '$lib/stores'
	import { findDuplicates } from '.'
	import AuthSpotify from '$lib/components/AuthSpotify.svelte'
	import CheckBox from '$lib/components/CheckBox.svelte'
	import Track from './Track.svelte'

	let playlistName = ''
	let playlistId: string
	let playlistCoverSrc: string
	let duplicates: Record<string, string[]> = {}
	const trackMap: Record<string, TrackObj> = {}
	const selections = sessioned<Record<string, boolean>>(
		'selected_duplicates',
		{},
		value =>
			Object.keys(value)
				.filter(k => value[k])
				.join(),
		str =>
			str.split(',').reduce<Record<string, boolean>>((obj, key) => {
				obj[key] = true
				return obj
			}, {})
	)
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
		selections.check()
	})

	async function getDuplicates(token: string) {
		const tracks = await getPlaylistTracks(token, playlistId)
		duplicates = findDuplicates(tracks, trackMap)
		for (const id in duplicates) if (!(id in $selections)) $selections[id] = false
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
					class:disabled={$selections[track.id]}
					style={`--duplicate-count: ${duplicates[track.id].length}`}
				>
					<div
						class="row cursor-pointer"
						on:click={$selections[track.id]
							? undefined
							: () => {
									selectedGroupId =
										selectedGroupId == track.id ? undefined : track.id
							  }}
					>
						<p class="text-right text-sm justify-self-end mb-0 md:ml-2">{track.index + 1}</p>
						<Track {track} />
						<p class="text-center mb-0 mx-1 md:mx-3">
							{duplicates[track.id].length}
						</p>
					</div>
					{#each duplicates[track.id] as duplicateId, index}
						<div
							class="row duplicate cursor-pointer !pl-4"
							style={`--index: ${index}`}
							on:click={() => {
								$selections[duplicateId] = !$selections[duplicateId]
							}}
						>
							<div>
								<CheckBox
									id={track.id}
									size="sm"
									bind:checked={$selections[duplicateId]}
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
		@apply grid gap-4 items-center rounded bg-inherit hover:bg-slate-50;
		grid-template-columns: 32px minmax(0, 4fr) minmax(0, 3fr) fit-content(36px);
		transition: background-color 0.2s ease-in-out;
		& *:first-child {
			@apply justify-self-end;
		}
	}
	.track-group {
		--track-hieght: 3.5rem;
		@apply relative bg-white overflow-y-hidden;
		height: var(--track-hieght);
		transition: height 0.4s ease-in-out;

		.row {
			height: var(--track-hieght);
		}

		.duplicate {
			@apply opacity-0;
			transition: opacity 0.4s ease-in-out;
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
			.row {
				@apply hover:bg-slate-200;
				&:first-child {
					@apply border-b border-b-neutral-400 rounded-b-none;
				}
			}
			.duplicate {
				@apply opacity-100;
				top: calc((var(--index) + 1) * var(--track-hieght));
			}
		}
	}
</style>
