import { authorize } from '@/lib/spotify/auth'
import { setItem } from '@/lib/storage'

interface AuthSpotifyButtonProps {
	authType?: Parameters<typeof authorize>[0]
	scopes?: string
}

export function AuthSpotifyButton({ authType = 'pkce', scopes }: AuthSpotifyButtonProps) {
	return (
		<>
			<button
				className="btn-primary"
				onClick={() => {
					let url = location.pathname
					if (location.search) url += location.search
					if (location.hash) url += location.hash
					setItem('directed_from', url)
					void authorize(authType, scopes)
				}}
			>
				Authorize
			</button>
			<p className="mt-4">
				In order to use our tools, we need limited access to your Spotify account.
			</p>
		</>
	)
}
