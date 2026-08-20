import { useActionData, useNavigation, type ActionFunctionArgs } from 'react-router-dom'
import { sendSignInLinkToEmail } from 'firebase/auth'
import { auth } from '@/lib/firebase/auth'
import { setCookie } from '@/lib/cookie'
import { requireField } from '@/lib/form'
import { EmailForm } from '@/lib/components/EmailForm'

export async function action({ request }: ActionFunctionArgs) {
	const email = requireField(await request.formData(), 'email')

	const url = new URL(location.origin + '/login/callback')
	const redirect = new URL(request.url).searchParams.get('redirect')
	if (redirect) url.searchParams.set('state', redirect)

	await sendSignInLinkToEmail(auth, email, { url: url.href, handleCodeInApp: true })
	setCookie('email', email)

	return { email }
}

export function Login() {
	const sent = useActionData<typeof action>()
	const navigation = useNavigation()
	const sending = navigation.state === 'submitting'

	return (
		<>
			<EmailForm disabled={sending || sent !== undefined} />

			{sent && <p className="mt-4 text-center">Sign in link sent to {sent.email}.</p>}
		</>
	)
}
