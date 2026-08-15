import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import type { User } from 'firebase/auth'

/** Gate for routes needing a Firebase session; the user comes from the loader. */
export function AuthFirebase({ user, children }: { user: User | null; children: ReactNode }) {
	const { pathname } = useLocation()

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
