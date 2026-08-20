import { Link } from 'react-router-dom'

type Playlist = SpotifyApi.PlaylistObjectSimplified

interface PlaylistPreviewProps {
	playlist?: Playlist
	link?: (playlist: Playlist) => string
}

const defaultLink = (playlist: Playlist) => `${location.pathname}/playlist?id=${playlist.id}`

function getPhoto(images: SpotifyApi.ImageObject[]) {
	if (images.length == 1)
		return images[0].url // 640x640
	else return images[1].url // 300x300
}

export function PlaylistPreview({ playlist, link = defaultLink }: PlaylistPreviewProps) {
	const className = `grid bg-[#0000001a] rounded-sm h-20 items-center${
		playlist ? '' : ' loading'
	}`
	const style = { gridTemplateColumns: '80px auto' }

	const content = (
		<>
			<div className="playlistImage">
				{playlist && (
					<img
						src={getPhoto(playlist.images)}
						alt={`"${playlist.name}" playlist cover`}
						height="80"
						width="80"
						className="object-cover rounded-l-sm"
					/>
				)}
			</div>
			<div>
				<p className="px-4 mb-0 text-left">{playlist?.name ?? ''}</p>
			</div>
		</>
	)

	// Skeleton placeholders had no href, so they stay inert anchors.
	if (!playlist) {
		return (
			<a className={className} style={style}>
				{content}
			</a>
		)
	}
	return (
		<Link to={link(playlist)} className={className} style={style}>
			{content}
		</Link>
	)
}
