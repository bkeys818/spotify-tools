import { getMe, getMyPlaylists } from '@/lib/spotify'
import { useError } from '@/lib/contexts/error'
import { usePromise } from '@/hooks/usePromise'
import { PlaylistPreview } from './PlaylistPreview'
import './PlaylistGrid.css'

type Playlist = SpotifyApi.PlaylistObjectSimplified

interface PlaylistGridProps {
	token: string
	playlistLink?: (playlist: Playlist) => string
}

export function PlaylistGrid({ token, playlistLink }: PlaylistGridProps) {
	const { setError } = useError()

	const { status, data } = usePromise(async () => {
		try {
			const { id } = await getMe(token)
			const playlists = await getMyPlaylists(token)
			return playlists.filter(p => p.owner.id === id && p.tracks.total > 0)
		} catch (err) {
			setError(err)
			return [] as Playlist[]
		}
	}, [token])

	return (
		<div className="playlistGrid">
			{status === 'pending'
				? Array.from({ length: 8 }, (_, i) => (
						<PlaylistPreview key={i} link={playlistLink} />
					))
				: data?.map(playlist => (
						<PlaylistPreview
							key={playlist.id}
							playlist={playlist}
							link={playlistLink}
						/>
					))}
		</div>
	)
}
