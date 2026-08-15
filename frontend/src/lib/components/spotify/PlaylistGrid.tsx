import { PlaylistPreview } from './PlaylistPreview'
import './PlaylistGrid.css'

type Playlist = SpotifyApi.PlaylistObjectSimplified

interface PlaylistGridProps {
	playlists: Playlist[]
	link?: (playlist: Playlist) => string
}

/** Purely presentational — the route loader does the fetching. */
export function PlaylistGrid({ playlists, link }: PlaylistGridProps) {
	return (
		<div className="playlistGrid">
			{playlists.map(playlist => (
				<PlaylistPreview key={playlist.id} playlist={playlist} link={link} />
			))}
		</div>
	)
}

/** Suspense fallback: the same eight placeholder cards as before. */
export function PlaylistGridSkeleton() {
	return (
		<div className="playlistGrid">
			{Array.from({ length: 8 }, (_, i) => (
				<PlaylistPreview key={i} />
			))}
		</div>
	)
}
