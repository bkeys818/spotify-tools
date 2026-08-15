import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { sendSignInLinkToEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase/auth'
import { setCookie } from '@/lib/cookie'
import { usePromise } from '@/hooks/usePromise'
import { EmailForm } from '@/lib/components/EmailForm'

export function Login() {
	const [searchParams] = useSearchParams()
	const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

	const { status, error } = usePromise(
		submittedEmail
			? async () => {
					const url = new URL(location.origin + location.pathname + '/callback')
					const redirect = searchParams.get('redirect')
					if (redirect) url.searchParams.set('state', redirect)
					await sendSignInLinkToEmail(auth, submittedEmail, {
						url: url.href,
						handleCodeInApp: true
					})
					setCookie('email', submittedEmail)
				}
			: null,
		[submittedEmail]
	)

	return (
		<>
			<EmailForm onSubmit={setSubmittedEmail} disabled={submittedEmail !== null} />

			{submittedEmail && status === 'fulfilled' && (
				<p className="mt-4 text-center">Sign in link sent to {submittedEmail}.</p>
			)}
			{submittedEmail && status === 'rejected' && (
				<p className="mt-4 text-center">
					Something went wrong: {error instanceof Error ? error.message : String(error)}
				</p>
			)}
		</>
	)
}
