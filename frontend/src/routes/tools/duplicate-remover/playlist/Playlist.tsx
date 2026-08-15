import { useEffect, useState, type CSSProperties } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { getPlaylistTracks, removeTracksFromPlaylist, addTracksToPlaylist } from '@/lib/spotify'
import { useError } from '@/lib/contexts/error'
import { usePromise } from '@/hooks/usePromise'
import { AuthSpotify } from '@/lib/components/AuthSpotify'
import { CheckBox } from '@/lib/components/CheckBox'
import { path } from '../constants'
import { Track } from './Track'
import { findDuplicates, readSelections, writeSelections, type DuplicateTrack } from './duplicates'
import './playlist.css'

export function Playlist() {
	const [searchParams] = useSearchParams()
	const name = searchParams.get('name')
	const id = searchParams.get('id')
	const image = searchParams.get('image')

	if (!name || !id || !image) return <Navigate to="/duplicate-remover" replace />

	return (
		<>
			<title>{`Remove Duplicates - ${name}`}</title>
			<AuthSpotify path={path} scopes="playlist-modify-public playlist-modify-private">
				{token => (
					<Duplicates
						token={token}
						playlistId={id}
						playlistName={name}
						playlistCoverSrc={image}
					/>
				)}
			</AuthSpotify>
		</>
	)
}

interface DuplicatesProps {
	token: string
	playlistId: string
	playlistName: string
	playlistCoverSrc: string
}

function Duplicates({ token, playlistId, playlistName, playlistCoverSrc }: DuplicatesProps) {
	const { setError } = useError()
	const [tracks, setTracks] = useState<DuplicateTrack[]>([])
	const [selections, setSelections] = useState<Set<string>>(readSelections)
	const [selectedGroupKey, setSelectedGroupKey] = useState<string | undefined>(undefined)

	const { status } = usePromise(async () => {
		const allTracks = await getPlaylistTracks(token, playlistId)
		const found = findDuplicates(allTracks)
		setTracks(found)
		// Drop any restored selections whose track is no longer a duplicate.
		const valid = new Set(found.map(track => track.key))
		setSelections(prev => new Set([...prev].filter(key => valid.has(key))))
		return found
	}, [token, playlistId])

	useEffect(() => {
		writeSelections(selections)
	}, [selections])

	function toggle(key: string) {
		setSelections(prev => {
			const next = new Set(prev)
			if (next.has(key)) next.delete(key)
			else next.add(key)
			return next
		})
	}

	async function removeTracks() {
		if (selections.size == 0) return

		const uris: string[] = []
		const removedTracks: DuplicateTrack[] = []
		const remainingTracks: DuplicateTrack[] = []
		const updatedIndexes: Record<string, number> = {}
		const remainingExactDuplicates: DuplicateTrack[] = []
		for (const track of tracks)
			if (selections.has(track.key)) {
				removedTracks.push(track)
				uris.push(track.uri)
			} else {
				if (!track.duplicates.every(duplicate => selections.has(duplicate.key)))
					remainingTracks.push(track)
				updatedIndexes[track.id] = track.index - removedTracks.length
				for (const duplicate of track.duplicates)
					if (selections.has(duplicate.key) && track.id == duplicate.id)
						remainingExactDuplicates.push(track)
			}

		try {
			await removeTracksFromPlaylist(token, playlistId, uris)
			// for all removed tracks
			for (const removedTrack of removedTracks) {
				// for duplicates of duplicates (originals)
				for (const { duplicates: originals } of removedTrack.duplicates) {
					// delete indented instances of removed duplicate
					originals.splice(originals.indexOf(removedTrack), 1)
				}
			}
			// update index of remaining tracks
			for (const track of remainingTracks)
				if (track.id in updatedIndexes) track.index = updatedIndexes[track.id]

			setTracks([...remainingTracks])
			setSelections(new Set())

			// add back any exact duplicates that weren't maked for removal
			await Promise.all(
				remainingExactDuplicates.map(track =>
					addTracksToPlaylist(
						token,
						playlistId,
						[track.uri],
						updatedIndexes[track.id] ?? track.index
					)
				)
			)
		} catch (err) {
			// The Svelte version wrote the raw error into the playlist title.
			setError(err)
		}
	}

	return (
		<>
			<div className="flex items-end my-4">
				<div className="hidden md:block md:w-32 md:h-32 md:rounded-sm">
					<img
						className="object-cover h-full"
						src={playlistCoverSrc}
						alt={playlistName + ' playlist cover image'}
					/>
				</div>
				<h2 className="text-left text-4xl md:pl-4 lg:pl-6">{playlistName}</h2>
			</div>

			{selections.size > 0 && (
				<button
					className="fixed bottom-4 right-2 btn-secondary md:bottom-6 md:right-4 z-10 bg-white drop-shadow-sm"
					onClick={() => void removeTracks()}
				>
					Remove Duplicates
				</button>
			)}

			<div>
				<div className="row h-8 border-b border-b-neutral-600 !rounded-none">
					<p className="text-right mb-0 text-sm text-neutral-600">#</p>
					<p className="mb-0 text-sm text-neutral-600">Track &amp; Artist(s)</p>
					<p className="mb-0 text-sm text-neutral-600">Album</p>
					<div className="mx-3" />
				</div>

				{status !== 'pending' &&
					(tracks.length == 0 ? (
						<h3 className="text-center my-4">No Duplicates Found!</h3>
					) : (
						tracks.map(track => {
							const isDisabled = selections.has(track.key)
							const isExpanded = track.key == selectedGroupKey
							return (
								<div
									key={track.key}
									className={`track-group${isExpanded ? ' selected' : ''}${
										isDisabled ? ' disabled' : ''
									}`}
									style={
										{
											'--duplicate-count': track.duplicates.length
										} as CSSProperties
									}
								>
									<div
										className="row cursor-pointer"
										onClick={
											isDisabled
												? undefined
												: () =>
														setSelectedGroupKey(
															isExpanded ? undefined : track.key
														)
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
										track.duplicates.map((duplicateTrack, index) => (
											<div
												key={duplicateTrack.key}
												className="row duplicate cursor-pointer !pl-4"
												style={{ '--index': index } as CSSProperties}
												onClick={() => toggle(duplicateTrack.key)}
											>
												{/* pointer-events-none so the row's handler is the
												    only thing that ever toggles a selection. */}
												<div className="pointer-events-none">
													<CheckBox
														id={duplicateTrack.key}
														size="sm"
														checked={selections.has(duplicateTrack.key)}
													/>
												</div>
												<Track track={duplicateTrack} />
											</div>
										))}
								</div>
							)
						})
					))}
			</div>
		</>
	)
}
