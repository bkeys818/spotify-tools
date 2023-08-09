<script lang="ts">
	import { path } from '../+page.svelte'
	import { onMount } from 'svelte'
	import { getPlaylistTracks, removeTracksFromPlaylist } from '$lib/spotify'
	import { selections, findDuplicates, type DuplicateTrack } from '.'
	import AuthSpotify from '$lib/components/AuthSpotify.svelte'
	import CheckBox from '$lib/components/CheckBox.svelte'
	import Track from './Track.svelte'

	let playlistName = ''
	let playlistId: string
	let playlistCoverSrc: string
	let duplicates: DuplicateTrack[] = []
	let selectedGroupKey: string | undefined = undefined

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
		duplicates = findDuplicates(tracks)
	}

	async function removeTracks(token: string) {
		const uris: string[] = []
		const removedTracks: DuplicateTrack[] = []
		const remainingTracks: DuplicateTrack[] = []
		for (const track of duplicates) {
			if (track.selected) {
				uris.push(track.uri)
				removedTracks.push(track)
			} else remainingTracks.push(track)
		}
		if (uris.length > 0)
			try {
				await removeTracksFromPlaylist(token, playlistId, uris)
				duplicates = remainingTracks
				$selections = []
				for (const removedTrack of removedTracks) {
					for (const { duplicates } of removedTrack.duplicates) {
						const index = duplicates.indexOf(removedTrack)
						duplicates.splice(index, 1)
					}
				}
			} catch (error) {
				console.error(error)
				playlistName = JSON.stringify(error)
			}
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
	{#if $selections.length > 0}
		<button
			class="fixed bottom-4 right-2 btn-secondary md:bottom-6 md:right-4"
			on:click={() => removeTracks(token)}
		>
			Remove Duplicates
		</button>
	{/if}
	<div>
		<div class="row h-8 border-b border-b-neutral-600 !rounded-none">
			<p class="text-right mb-0 text-sm text-neutral-600">#</p>
			<p class="mb-0 text-sm text-neutral-600">Track & Artist(s)</p>
			<p class="mb-0 text-sm text-neutral-600">Album</p>
			<div class="mx-3" />
		</div>
		{#await getDuplicates(token) then}
			{#each duplicates as track (track.key)}
				<div
					class="track-group"
					class:selected={track.key == selectedGroupKey}
					class:disabled={track.selected}
					style={`--duplicate-count: ${track.duplicates.length}`}
				>
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<div
						class="row cursor-pointer"
						on:click={track.selected
							? undefined
							: () => {
									selectedGroupKey =
										selectedGroupKey == track.key ? undefined : track.key
							  }}
					>
						<p class="text-right text-sm justify-self-end mb-0 md:ml-2">
							{track.index + 1}
						</p>
						<Track {track} />
						<p class="text-center mb-0 mx-1 md:mx-3">
							{track.duplicates.length}
						</p>
					</div>
					{#each track.duplicates as duplicateTrack, index}
						<!-- svelte-ignore a11y-click-events-have-key-events -->
						<div
							class="row duplicate cursor-pointer !pl-4"
							style={`--index: ${index}`}
							on:click={() => {
								duplicateTrack.selected = !duplicateTrack.selected
							}}
						>
							<div>
								<CheckBox
									id={duplicateTrack.id}
									size="sm"
									bind:checked={duplicateTrack.selected}
								/>
							</div>
							<Track track={duplicateTrack} />
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
			& :global(p),
			:global(img) {
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
