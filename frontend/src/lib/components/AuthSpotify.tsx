import type { ReactNode } from 'react'
import { useSpotifyToken } from '@/hooks/useSpotifyToken'
import { AuthSpotifyButton } from './AuthSpotifyButton'

interface AuthSpotifyProps {
	path: string
	scopes?: string
	/** Render prop, replacing Svelte's `<slot token={...}>` / `let:token`. */
	children: (token: string) => ReactNode
}

export function AuthSpotify({ path, scopes, children }: AuthSpotifyProps) {
	const token = useSpotifyToken(path)

	if (token === null) return <AuthSpotifyButton authType="token" scopes={scopes} />
	return <>{children(token)}</>
}
