import { Suspense, use, useEffect, useMemo, useState, type CSSProperties } from 'react'
import {
	Form,
	redirect,
	useLoaderData,
	useNavigation,
	type ActionFunctionArgs,
	type LoaderFunctionArgs
} from 'react-router-dom'
import { getPlaylistItems, removeItemsFromPlaylist, addItemsToPlaylist } from '@/lib/spotify'
import { requireToken } from '@/lib/token'
import { CheckBox } from '@/lib/components/CheckBox'
import { Track } from './Track'
import {
	findDuplicates,
	planRemoval,
	readSelections,
	writeSelections,
	type DuplicateTrack
} from './duplicates'
import './playlist.css'

function playlistParams(url: string) {
	const params = new URL(url).searchParams
	const name = params.get('name'),
		id = params.get('id'),
		image = params.get('image')
	if (!name || !id || !image) return null
	return { name, id, image }
}

export function loader({ request }: LoaderFunctionArgs) {
	const playlist = playlistParams(request.url)
	if (!playlist) return redirect('/duplicate-remover')

	const token = requireToken()!
	return {
		playlist,
		// Deferred so the header renders while the tracks load.
		tracks: getPlaylistItems(token, playlist.id).then(findDuplicates)
	}
}

export async function action({ request }: ActionFunctionArgs) {
	const playlist = playlistParams(request.url)
	if (!playlist) return redirect('/duplicate-remover')

	const selected = new Set((await request.formData()).getAll('key').map(String))
	if (selected.size == 0) return null

	const token = requireToken()!
	// Re-read from Spotify rather than trusting client state, which is what
	// makes the old index-patching unnecessary.
	const tracks = findDuplicates(await getPlaylistItems(token, playlist.id))
	const { uris, reAdds } = planRemoval(tracks, selected)

	await removeItemsFromPlaylist(token, playlist.id, uris)
	await Promise.all(
		reAdds.map(({ uri, position }) => addItemsToPlaylist(token, playlist.id, [uri], position))
	)

	return { removed: uris.length }
}

export function Playlist() {
	const { playlist, tracks } = useLoaderData<typeof loader>()

	return (
		<>
			<title>{`Remove Duplicates - ${playlist.name}`}</title>

			<div className="flex items-end my-4">
				<div className="hidden md:block md:w-32 md:h-32 md:rounded-sm">
					<img
						className="object-cover h-full"
						src={playlist.image}
						alt={playlist.name + ' playlist cover image'}
					/>
				</div>
				<h2 className="text-left text-4xl md:pl-4 lg:pl-6">{playlist.name}</h2>
			</div>

			<Suspense fallback={<TrackTableHeader />}>
				<DuplicateRows promise={tracks} />
			</Suspense>
		</>
	)
}

function DuplicateRows({ promise }: { promise: Promise<DuplicateTrack[]> }) {
	const tracks = use(promise)
	const navigation = useNavigation()
	const submitting = navigation.state === 'submitting'

	const [stored, setStored] = useState<Set<string>>(readSelections)
	const [expandedKey, setExpandedKey] = useState<string | undefined>(undefined)

	// Selections that no longer match a duplicate are dropped by deriving the
	// effective set during render rather than correcting state in an effect —
	// the revalidation after a removal makes that a routine occurrence.
	const selections = useMemo(() => {
		const valid = new Set(tracks.map(track => track.key))
		return new Set([...stored].filter(key => valid.has(key)))
	}, [tracks, stored])

	useEffect(() => {
		writeSelections(selections)
	}, [selections])

	function toggle(key: string) {
		setStored(prev => {
			const next = new Set(prev)
			if (next.has(key)) next.delete(key)
			else next.add(key)
			return next
		})
	}

	return (
		<Form method="post">
			{selections.size > 0 && (
				<button
					type="submit"
					disabled={submitting}
					className="fixed bottom-4 right-2 btn-secondary md:bottom-6 md:right-4 z-10 bg-white drop-shadow-sm"
				>
					{submitting ? 'Removing…' : 'Remove Duplicates'}
				</button>
			)}

			<TrackTableHeader />

			{tracks.length == 0 ? (
				<h3 className="text-center my-4">No Duplicates Found!</h3>
			) : (
				tracks.map(track => {
					const isDisabled = selections.has(track.key)
					const isExpanded = track.key == expandedKey
					return (
						<div
							key={track.key}
							className={`track-group${isExpanded ? ' selected' : ''}${
								isDisabled ? ' disabled' : ''
							}`}
							style={
								{ '--duplicate-count': track.duplicates.length } as CSSProperties
							}
						>
							<div
								className="row cursor-pointer"
								onClick={
									isDisabled
										? undefined
										: () => setExpandedKey(isExpanded ? undefined : track.key)
								}
							>
								<p className="text-right text-sm justify-self-end mb-0 md:ml-2">
									{track.index + 1}
								</p>
								<Track track={track} />
								<p className="text-center mb-0 mx-1 md:mx-3">
									{track.duplicates.length}
								</p>
							</div>

							{isExpanded &&
								track.duplicates.map((duplicate, index) => (
									<div
										key={duplicate.key}
										className="row duplicate cursor-pointer pl-4!"
										style={{ '--index': index } as CSSProperties}
										onClick={() => toggle(duplicate.key)}
									>
										{/* pointer-events-none so the row's handler is the
										    only thing that ever toggles a selection. */}
										<div className="pointer-events-none">
											<CheckBox
												id={duplicate.key}
												size="sm"
												checked={selections.has(duplicate.key)}
											/>
										</div>
										<Track track={duplicate} />
									</div>
								))}
						</div>
					)
				})
			)}

			{/* The selection travels to the action as form data. */}
			{[...selections].map(key => (
				<input key={key} type="hidden" name="key" value={key} />
			))}
		</Form>
	)
}

function TrackTableHeader() {
	return (
		<div className="row h-8 border-b border-b-neutral-600 rounded-none!">
			<p className="text-right mb-0 text-sm text-neutral-600">#</p>
			<p className="mb-0 text-sm text-neutral-600">Track &amp; Artist(s)</p>
			<p className="mb-0 text-sm text-neutral-600">Album</p>
			<div className="mx-3" />
		</div>
	)
}
