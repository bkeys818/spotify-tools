import { useEffect, useState } from 'react'
import { publicLikedSongs } from '@/lib/firebase/functions'
import { parseCode } from '@/lib/spotify/auth'
import { useError } from '@/lib/contexts/error'
import { usePromise } from '@/hooks/usePromise'
import { useOneShotEffect } from '@/hooks/useOneShotEffect'
import { toolInfo } from '@/lib/tools'
import { ToolHeader } from '@/lib/components/ToolHeader'
import { AuthFirebase } from '@/lib/components/AuthFirebase'
import { AuthSpotifyButton } from '@/lib/components/AuthSpotifyButton'
import { Spinner } from '@/lib/components/Spinner'
import { SpotifyEmbed } from '@/lib/components/SpotifyEmbed'

export function PublicLikedSongs() {
	const { setError } = useError()
	const [code, setCode] = useState<string | null>(null)
	const [isPopulated, setIsPopulated] = useState<boolean | undefined>(false)

	// parseCode strips the query via history.replaceState, so this must run once.
	useOneShotEffect(() => {
		try {
			setCode(parseCode())
		} catch (err) {
			setError(err)
		}
	})

	async function populate(userId: string) {
		try {
			await publicLikedSongs.populate({ userId, origin: location.origin })
			setIsPopulated(true)
		} catch (err) {
			setIsPopulated(undefined)
			setError(err)
		}
	}

	const result = usePromise(
		code
			? async () => {
					const { data } = await publicLikedSongs.create({
						code,
						origin: location.origin
					})
					// Deliberately not awaited, matching the original: the embed
					// renders as soon as the playlist exists, while it populates.
					void populate(data.userId)
					return data.playlistId
				}
			: null,
		[code]
	)

	// The Svelte `{#await}` had no catch branch, so a failed `create` rendered
	// nothing at all. Surface it through the usual error popup instead.
	useEffect(() => {
		if (result.status === 'rejected') setError(result.error)
	}, [result.status, result.error, setError])

	return (
		<>
			<ToolHeader info={toolInfo['public-liked-songs']} />

			<div className="my-4 text-center">
				<AuthFirebase>
					{!code ? (
						<AuthSpotifyButton
							authType="code"
							scopes="user-library-read playlist-modify-public"
						/>
					) : result.status === 'pending' ? (
						<Spinner />
					) : result.status === 'fulfilled' ? (
						<>
							<SpotifyEmbed
								title="public-liked-songs"
								type="playlist"
								id={result.data}
								className="mx-auto"
							/>
							{isPopulated === true && <p>Playlist synced!</p>}
							{isPopulated === false && (
								<p className="loading">Populating playlist</p>
							)}
						</>
					) : null}
				</AuthFirebase>
			</div>
		</>
	)
}
