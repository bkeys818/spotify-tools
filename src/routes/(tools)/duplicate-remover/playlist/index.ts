import { sessioned } from '$lib/stores'
import { get } from 'svelte/store'
import type { TrackObj } from '$lib/spotify'

export const selections = sessioned<string[]>(
	'selected_duplicates',
	[],
	value => value.join(),
	str => str.split(',')
)

export interface DuplicateTrack extends TrackObj {
	readonly key: string
	duplicates: DuplicateTrack[]
	selected: boolean
}

const keyFor = (track: TrackObj) => track.id + '-' + track.index
const createDuplicate = (track: TrackObj, key: string): DuplicateTrack => {
	return {
		...track,
		key,
		duplicates: [],
		get selected() {
			return get(selections).includes(key)
		},
		set selected(value: boolean) {
			selections.update(selections => {
				console.log(selections)
				const i = selections.findIndex(k => k == key)
				if (!value && i != -1) selections.splice(i, 1)
				else if (value && i == -1) selections.push(key)
				return selections
			})
		}
	}
}

export function findDuplicates(tracks: TrackObj[]) {
	const trackMap: Record<string, DuplicateTrack> = {}
	selections.check()
	const sorted = tracks.sort((a, b) => a.name.localeCompare(b.name))
	for (let i = 0; i < sorted.length; i++) {
		const key1 = keyFor(sorted[i])
		for (let j = i + 1; j < sorted.length && sorted[i].name == sorted[j].name; j++) {
			const key2 = keyFor(sorted[j])
			if (sorted[i].id == sorted[j].id || artistMatch(sorted[i], sorted[j])) {
				if (!(key1 in trackMap)) trackMap[key1] = createDuplicate(sorted[i], key1)
				if (!(key2 in trackMap)) trackMap[key2] = createDuplicate(sorted[j], key2)
				trackMap[key1].duplicates.push(trackMap[key2])
				trackMap[key2].duplicates.push(trackMap[key1])
			}
		}
	}
	selections.update(selections => selections.filter(key => key in trackMap))
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
