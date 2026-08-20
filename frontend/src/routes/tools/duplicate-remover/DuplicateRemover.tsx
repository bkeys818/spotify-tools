import { Suspense, use } from 'react'
import { useLoaderData } from 'react-router-dom'
import { getMe, getMyPlaylists } from '@/lib/spotify'
import { requireToken } from '@/lib/token'
import { toolInfo } from '@/lib/tools'
import { ToolHeader } from '@/lib/components/ToolHeader'
import { PlaylistGrid, PlaylistGridSkeleton } from '@/lib/components/spotify/PlaylistGrid'
import { id } from './constants'

type Playlist = SpotifyApi.PlaylistObjectSimplified

async function getOwnedPlaylists(token: string) {
	const { id: userId } = await getMe(token)
	const playlists = await getMyPlaylists(token)
	return playlists.filter(p => p.owner.id === userId && p.tracks.total > 0)
}

export function loader() {
	// Not awaited: the grid renders skeleton cards inside Suspense meanwhile.
	return { playlists: getOwnedPlaylists(requireToken()!) }
}

const playlistLink = ({ name, id, images }: Playlist) =>
	`/duplicate-remover/playlist?${new URLSearchParams({ name, id, image: images[0].url })}`

export function DuplicateRemover() {
	const { playlists } = useLoaderData<typeof loader>()

	return (
		<>
			<ToolHeader info={toolInfo[id]} />

			<div className="my-4 text-center">
				<Suspense fallback={<PlaylistGridSkeleton />}>
					<Playlists promise={playlists} />
				</Suspense>
			</div>
		</>
	)
}

function Playlists({ promise }: { promise: Promise<Playlist[]> }) {
	return <PlaylistGrid playlists={use(promise)} link={playlistLink} />
}
