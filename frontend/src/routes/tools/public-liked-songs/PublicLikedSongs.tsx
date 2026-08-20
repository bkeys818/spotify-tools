import { Suspense, use, useEffect } from 'react'
import {
	useFetcher,
	useLoaderData,
	type ActionFunctionArgs,
	type LoaderFunctionArgs
} from 'react-router-dom'
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

	// Deferred so the spinner shows while the callable runs.
	const playlist = publicLikedSongs
		.create({ code, origin: location.origin })
		.then(result => result.data)

	return { user, playlist }
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

	return (
		<>
			<ToolHeader info={toolInfo['public-liked-songs']} />

			<div className="my-4 text-center">
				<AuthFirebase user={user}>
					{playlist === null ? (
						<AuthSpotifyButton
							authType="code"
							scopes="user-library-read playlist-modify-public"
						/>
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

type CreateResult = { playlistId: string; userId: string }

function Playlist({ promise }: { promise: Promise<CreateResult> }) {
	const { playlistId, userId } = use(promise)
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
