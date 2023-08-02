import type { TrackObj } from '$lib/spotify'

export interface DuplicateTrack extends TrackObj {
	duplicates: DuplicateTrack[]
	selected: boolean
}

const createDuplicate = (track: TrackObj): DuplicateTrack => ({
	...track,
	duplicates: [],
	selected: false
})

export function findDuplicates(tracks: TrackObj[]) {
	const trackMap: Record<string, DuplicateTrack> = {}
	const sorted = tracks.sort((a, b) => a.name.localeCompare(b.name))
	for (let i = 0; i < sorted.length; i++) {
		for (let j = i + 1; j < sorted.length && sorted[i].name == sorted[j].name; j++) {
			if (artistMatch(sorted[i], sorted[j])) {
				if (!(sorted[i].id in trackMap)) trackMap[sorted[i].id] = createDuplicate(sorted[i])
				if (!(sorted[j].id in trackMap)) trackMap[sorted[j].id] = createDuplicate(sorted[j])
				trackMap[sorted[i].id].duplicates.push(trackMap[sorted[j].id])
				trackMap[sorted[j].id].duplicates.push(trackMap[sorted[i].id])
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
