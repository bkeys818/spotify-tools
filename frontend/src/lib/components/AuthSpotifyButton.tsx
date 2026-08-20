import { authorize } from '@/lib/spotify/auth'
import { setCookie } from '@/lib/cookie'

interface AuthSpotifyButtonProps {
	authType?: Parameters<typeof authorize>[0]
	scopes?: string
}

export function AuthSpotifyButton({ authType = 'token', scopes }: AuthSpotifyButtonProps) {
	return (
		<>
			<button
				className="btn-primary"
				onClick={() => {
					let url = location.pathname
					if (location.search) url += location.search
					if (location.hash) url += location.hash
					setCookie('directed_from', url)
					authorize(authType, scopes)
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
