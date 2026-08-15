import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useUser } from '@/lib/contexts/user'

export function AuthFirebase({ children }: { children: ReactNode }) {
	const user = useUser()
	const { pathname } = useLocation()

	if (user === undefined) return null // still resolving auth state
	if (user === null) {
		return (
			<>
				<Link
					to={`/login?redirect=${encodeURIComponent(pathname)}`}
					className="btn-primary"
				>
					Login
				</Link>
				<p className="mt-4">Log in to use our tools</p>
			</>
		)
	}
	return <>{children}</>
}
