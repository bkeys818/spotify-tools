import { redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from 'react-router-dom'
import { signInWithEmailLink, isSignInWithEmailLink } from 'firebase/auth'
import { auth } from '@/lib/firebase/auth'
import { getAllCookies } from '@/lib/cookie'
import { requireField } from '@/lib/form'
import { EmailForm } from '@/lib/components/EmailForm'

class AccessError extends Error {
	// The Svelte version declared this as a *method* named `super`, so the
	// constructor never ran and `this.super` was not a function.
	constructor(message: string) {
		super(message)
		this.name = 'AccessError'
	}
}

async function completeSignIn(email: string, url: string) {
	if (!isSignInWithEmailLink(auth, url))
		throw new AccessError(`Url isn't a valid "sign in with email link".`)

	await signInWithEmailLink(auth, email, url)

	// The link carries the originating page through as `state`.
	const state = new URL(url).searchParams.get('state')
	return redirect(state ?? '/')
}

/** Signs in straight away when the address is still in the cookie. */
export function loader({ request }: LoaderFunctionArgs) {
	const { email } = getAllCookies()
	if (!email) return null
	return completeSignIn(email, request.url)
}

/** Otherwise the visitor re-enters it and we sign in from the submission. */
export async function action({ request }: ActionFunctionArgs) {
	const email = requireField(await request.formData(), 'email')
	return completeSignIn(email, request.url)
}

export function LoginCallback() {
	// Reached only when the loader found no cookie; a successful sign-in
	// redirects, so there is nothing to render for the happy path.
	return (
		<>
			<EmailForm />
			<p className="mt-4 text-center">Just making sure it&apos;s it you!</p>
		</>
	)
}
