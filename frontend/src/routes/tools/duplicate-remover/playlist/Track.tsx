import type { TrackObj } from '@/lib/spotify'

export function Track({ track }: { track: TrackObj }) {
	const albumCoverSrc =
		track.album.images.length > 0
			? track.album.images.length == 1
				? track.album.images[0].url
				: track.album.images[2].url
			: undefined

	return (
		<>
			<div className="flex gap-4" title={track.id}>
				<img
					src={albumCoverSrc}
					alt={track.album.name + ' album cover'}
					width="40"
					height="40"
					className="hidden md:block object-cover h-[40px]"
				/>
				<div className="min-w-0">
					<p className="whitespace-nowrap overflow-hidden text-ellipsis mb-0">
						{track.name}
					</p>
					<p className="whitespace-nowrap overflow-hidden text-ellipsis mb-0 text-sm text-neutral-600">
						{track.artists.map(artist => artist.name).join(', ')}
					</p>
				</div>
			</div>
			<p className="whitespace-nowrap overflow-hidden text-ellipsis mb-0 text-neutral-600">
				{track.album.name}
			</p>
		</>
	)
}
