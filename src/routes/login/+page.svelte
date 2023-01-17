<script lang="ts">
	import EmailForm from '$lib/components/EmailForm.svelte'
	import { sendSignInLinkToEmail } from 'firebase/auth'
	import { auth } from '$lib/firebase/auth'
	import { setCookie } from '$lib/cookie'

	let submittedEmail: string
	let sendingEmail: ReturnType<typeof sendSignInLinkToEmail> | undefined = undefined

	function sendEmailTo(email: string) {
		submittedEmail = email
		const url = new URL(location.origin + location.pathname + '/callback')
		const query = new URLSearchParams(location.search.slice(1))
		const redirect = query.get('redirect')
		if (redirect) url.searchParams.set('state', redirect)
		sendingEmail = sendSignInLinkToEmail(auth, email, { url: url.href, handleCodeInApp: true })
		setCookie('email', email)
	}
</script>

<EmailForm onSumbit={sendEmailTo} disabled={sendingEmail ? true : false} />

{#if sendingEmail}
	{#await sendingEmail then}
		<p class="mt-4 text-center">Sign in link sent to {submittedEmail}.</p>
	{:catch error}
		<p class="mt-4 text-center">Something went wrong: {error.message}</p>
		{@debug error}
	{/await}
{/if}
