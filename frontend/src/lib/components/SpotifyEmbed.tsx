import type { CSSProperties } from 'react'

interface SpotifyEmbedProps {
	title: string
	type: 'playlist' | 'track' | 'album' | 'artist'
	id: string
	className?: string
	style?: CSSProperties
}

export function SpotifyEmbed({ title, type, id, className, style }: SpotifyEmbedProps) {
	return (
		<iframe
			className={className}
			style={style}
			title={title}
			src={`https://open.spotify.com/embed/${type}/${id}?utm_source=generator`}
			width="70%"
			height="80"
			frameBorder="0"
			allowFullScreen={false}
			allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
		/>
	)
}
