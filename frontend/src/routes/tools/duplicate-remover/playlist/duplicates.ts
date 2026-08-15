import type { TrackObj } from '@/lib/spotify'

export interface DuplicateTrack extends TrackObj {
	readonly key: string
	duplicates: DuplicateTrack[]
}

const keyFor = (track: TrackObj) => track.id + '-' + track.index

/**
 * `selected` used to be a getter/setter on each track proxying into a Svelte
 * store, which is what made `bind:checked` work. Selection state now lives in
 * the page as a Set of keys, leaving this a pure function.
 */
const createDuplicate = (track: TrackObj, key: string): DuplicateTrack => ({
	...track,
	key,
	duplicates: []
})

export function findDuplicates(tracks: TrackObj[]) {
	const trackMap: Record<string, DuplicateTrack> = {}
	const sorted = [...tracks].sort((a, b) => a.name.localeCompare(b.name))
	for (let i = 0; i < sorted.length; i++) {
		const key1 = keyFor(sorted[i])
		for (let j = i + 1; j < sorted.length && sorted[i].name == sorted[j].name; j++) {
			const key2 = keyFor(sorted[j])
			if (sorted[i].id == sorted[j].id || artistMatch(sorted[i], sorted[j])) {
				if (!(key1 in trackMap)) trackMap[key1] = createDuplicate(sorted[i], key1)
				if (!(key2 in trackMap)) trackMap[key2] = createDuplicate(sorted[j], key2)
				// Cyclic on purpose: removeTracks walks back through these to
				// prune duplicates-of-duplicates after a deletion.
				trackMap[key1].duplicates.push(trackMap[key2])
				trackMap[key2].duplicates.push(trackMap[key1])
			}
		}
	}
	return Object.values(trackMap).sort((a, b) => a.index - b.index)
}

/** True if the first listed artists match or all artist match. */
function artistMatch(a: TrackObj, b: TrackObj) {
	if (a.artists[0].id == b.artists[0].id) return true
	if (a.artists.length != b.artists.length) return false
	const aArtist = a.artists.sort(a => a.id.localeCompare(b.id)),
		bArtist = b.artists.sort(a => a.id.localeCompare(b.id))
	for (let i = 0; i < a.artists.length; i++) {
		if (aArtist[i].id != bArtist[i].id) return false
	}
	return true
}

const SELECTIONS_KEY = 'selected_duplicates'

export function readSelections(): Set<string> {
	const stored = sessionStorage.getItem(SELECTIONS_KEY)
	// `''.split(',')` yields `['']`, so the old store round-tripped an empty
	// selection into a single bogus key.
	if (!stored) return new Set()
	return new Set(stored.split(',').filter(Boolean))
}

export function writeSelections(selections: Set<string>) {
	sessionStorage.setItem(SELECTIONS_KEY, [...selections].join())
}
