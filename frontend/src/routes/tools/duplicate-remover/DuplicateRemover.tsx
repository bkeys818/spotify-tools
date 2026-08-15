import { toolInfo } from '@/lib/tools'
import { ToolHeader } from '@/lib/components/ToolHeader'
import { AuthSpotify } from '@/lib/components/AuthSpotify'
import { PlaylistGrid } from '@/lib/components/spotify/PlaylistGrid'
import { id, path } from './constants'

export function DuplicateRemover() {
	return (
		<>
			<ToolHeader info={toolInfo[id]} />

			<div className="my-4 text-center">
				<AuthSpotify path={path} scopes="playlist-modify-public playlist-modify-private">
					{token => (
						<PlaylistGrid
							token={token}
							playlistLink={({ name, id, images }) => {
								const image = images[0].url
								return `${location.pathname}/playlist?${new URLSearchParams({
									name,
									id,
									image
								}).toString()}`
							}}
						/>
					)}
				</AuthSpotify>
			</div>
		</>
	)
}
