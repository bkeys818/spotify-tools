import type { TrackObj } from '$lib/spotify'

export function findDuplicates(tracks: TrackObj[], trackMap: Record<string, TrackObj>) {
	const duplicates: Record<string, string[]> = {}
	const sorted = tracks.sort((a, b) => a.name.localeCompare(b.name))
	for (let i = 0; i < sorted.length; i++) {
		if (!(sorted[i].id in duplicates)) duplicates[sorted[i].id] = []
		for (let j = i + 1; j < sorted.length && sorted[i].name == sorted[j].name; j++)
			if (artistMatch(sorted[i], sorted[j])) {
				duplicates[sorted[i].id].push(sorted[j].id)
				if (!(sorted[j].id in duplicates)) duplicates[sorted[j].id] = []
				duplicates[sorted[j].id].push(sorted[i].id)
			}
		if (duplicates[sorted[i].id]?.length > 0)
			trackMap[sorted[i].id] = sorted[i] // populate trackMap
		else delete duplicates[sorted[i].id]
	}
	return duplicates
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
