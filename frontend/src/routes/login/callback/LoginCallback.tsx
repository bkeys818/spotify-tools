import { useState } from 'react'
import { signInWithEmailLink, isSignInWithEmailLink } from 'firebase/auth'
import { auth } from '@/lib/firebase/auth'
import { getAllCookies } from '@/lib/cookie'
import { usePromise } from '@/hooks/usePromise'
import { useOneShotEffect } from '@/hooks/useOneShotEffect'
import { EmailForm } from '@/lib/components/EmailForm'

class AccessError extends Error {
	// The Svelte version declared this as a *method* named `super`, so the
	// constructor never ran and `this.super` was not a function.
	constructor(message: string) {
		super(message)
		this.name = 'AccessError'
	}
}

export function LoginCallback() {
	const [email, setEmail] = useState<string | undefined>(undefined)

	useOneShotEffect(() => {
		setEmail(getAllCookies().email)
	})

	const { status, error } = usePromise(
		email
			? async () => {
					const url = location.href
					if (!isSignInWithEmailLink(auth, url))
						throw new AccessError(`Url isn't a valid "sign in with email link".`)
					await signInWithEmailLink(auth, email, url)
					const state = new URLSearchParams(location.search.slice(1)).get('state')
					location.href = state ?? '/'
				}
			: null,
		[email]
	)

	if (!email) {
		return (
			<>
				<EmailForm onSubmit={setEmail} />
				<p className="mt-4 text-center">Just making sure it&apos;s it you!</p>
			</>
		)
	}
	if (status === 'rejected') {
		return <p>Something went wrong: {error instanceof Error ? error.message : String(error)}</p>
	}
	return null
}
