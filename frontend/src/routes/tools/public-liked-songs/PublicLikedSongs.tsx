import { Suspense, use, useEffect } from 'react'
import {
	useFetcher,
	useLoaderData,
	useNavigate,
	useSearchParams,
	type ActionFunctionArgs,
	type LoaderFunctionArgs
} from 'react-router-dom'
import type { FunctionsError } from 'firebase/functions'
import { publicLikedSongs } from '@/lib/firebase/functions'
import { waitForUser } from '@/lib/firebase/auth'
import { requireField } from '@/lib/form'
import { toolInfo } from '@/lib/tools'
import { ToolHeader } from '@/lib/components/ToolHeader'
import { AuthFirebase } from '@/lib/components/AuthFirebase'
import { AuthSpotifyButton } from '@/lib/components/AuthSpotifyButton'
import { Spinner } from '@/lib/components/Spinner'
import { SpotifyEmbed } from '@/lib/components/SpotifyEmbed'

export async function loader({ request }: LoaderFunctionArgs) {
	const user = await waitForUser()
	const code = new URL(request.url).searchParams.get('code')
	if (!user || !code) return { user, playlist: null }

	// Deferred so the spinner shows while the callable runs. A code Spotify has
	// already spent — or let expire — resolves to null rather than rejecting:
	// the Firebase session is known good by this point, so `unauthenticated` can
	// only be the Spotify grant failing, and that is a prompt to authorize
	// again rather than something for the error boundary.
	const playlist = publicLikedSongs.create({ code, origin: location.origin }).then(
		result => result.data,
		(err: unknown) => {
			if (isFunctionsError(err) && err.code == 'functions/unauthenticated') return null
			throw err
		}
	)

	return { user, playlist }
}

function isFunctionsError(err: unknown): err is FunctionsError {
	return err instanceof Error && 'code' in err
}

/**
 * Spotify authorization codes are single use, so the loader must not re-run
 * once it has spent one — a revalidation kicked off by the populate fetcher
 * would call `create` again with a dead code.
 */
export function shouldRevalidate() {
	return false
}

export async function action({ request }: ActionFunctionArgs) {
	const userId = requireField(await request.formData(), 'userId')
	await publicLikedSongs.populate({ userId, origin: location.origin })
	return { populated: true }
}

export function PublicLikedSongs() {
	const { user, playlist } = useLoaderData<typeof loader>()
	useSpentCode()

	return (
		<>
			<ToolHeader info={toolInfo['public-liked-songs']} />

			<div className="my-4 text-center">
				<AuthFirebase user={user}>
					{playlist === null ? (
						<Authorize />
					) : (
						<Suspense fallback={<Spinner />}>
							<Playlist promise={playlist} />
						</Suspense>
					)}
				</AuthFirebase>
			</div>
		</>
	)
}

/**
 * `shouldRevalidate` only guards this router session; the code has to come out
 * of the address bar too, or reloading the page — including the full reload
 * Vite does when the dev server restarts — hands the spent code back to
 * `create` and Spotify answers `invalid_grant`. Replacing the history entry
 * rather than pushing keeps the back button off the dead URL as well, and
 * `shouldRevalidate` stops the navigation from re-running the loader.
 */
function useSpentCode() {
	const [searchParams] = useSearchParams()
	const navigate = useNavigate()
	const spent = searchParams.has('code')

	useEffect(() => {
		if (!spent) return
		const params = new URLSearchParams(searchParams)
		params.delete('code')
		void navigate({ search: params.toString() }, { replace: true })
	}, [spent, searchParams, navigate])
}

function Authorize({ note }: { note?: string }) {
	return (
		<>
			{note && <p className="mb-4">{note}</p>}
			<AuthSpotifyButton authType="code" scopes="user-library-read playlist-modify-public" />
		</>
	)
}

type CreateResult = { playlistId: string; userId: string }

function Playlist({ promise }: { promise: Promise<CreateResult | null> }) {
	const result = use(promise)
	if (!result) return <Authorize note="That Spotify authorization expired. Please try again." />
	return <SyncedPlaylist {...result} />
}

function SyncedPlaylist({ playlistId, userId }: CreateResult) {
	const fetcher = useFetcher<typeof action>()

	// Populating is a side effect of the playlist existing, not of a click, so
	// it is submitted once on mount rather than driven by a form.
	const submit = fetcher.submit
	useEffect(() => {
		void submit({ userId }, { method: 'post' })
	}, [submit, userId])

	return (
		<>
			<SpotifyEmbed
				title="public-liked-songs"
				type="playlist"
				id={playlistId}
				className="mx-auto"
			/>
			{fetcher.data?.populated ? (
				<p>Playlist synced!</p>
			) : (
				<p className="loading">Populating playlist</p>
			)}
		</>
	)
}
