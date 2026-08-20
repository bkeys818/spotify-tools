import { Outlet, useLoaderData } from 'react-router-dom'
import { readToken } from '@/lib/token'
import { AuthSpotifyButton } from '@/lib/components/AuthSpotifyButton'
import { toolInfo } from '@/lib/tools'
import { ToolHeader } from '@/lib/components/ToolHeader'
import { id } from './constants'

const SCOPES = 'playlist-modify-public playlist-modify-private'

export function loader() {
	return { authorized: readToken() !== null }
}

/**
 * Replaces the `<AuthSpotify>` render-prop component. Child routes only render
 * once a token exists, so their loaders can `requireToken()` freely.
 *
 * Child loaders read the cookie themselves rather than this loader's data:
 * React Router runs parent and child loaders in parallel, so a child cannot
 * depend on its parent's result, and the read is a synchronous cookie parse.
 */
export function SpotifyAuthLayout() {
	const { authorized } = useLoaderData<typeof loader>()

	if (!authorized) {
		return (
			<>
				<ToolHeader info={toolInfo[id]} />
				<div className="my-4 text-center">
					<AuthSpotifyButton authType="token" scopes={SCOPES} />
				</div>
			</>
		)
	}

	return <Outlet />
}
