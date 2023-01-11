<script lang="ts">
	import { sendSignInLinkToEmail } from 'firebase/auth'
	import { auth } from '$lib/firebase/auth'
	import { setCookie } from '$lib/cookie'

	let email: string
	let sendingEmail: ReturnType<typeof sendSignInLinkToEmail> | undefined

	function sendEmailTo() {
		const url = new URL(location.origin + location.pathname + '/callback')
		const query = new URLSearchParams(location.search.slice(1))
		const redirect = query.get('redirect')
		if (redirect) url.searchParams.set('state', redirect)
		sendingEmail = sendSignInLinkToEmail(auth, email, { url: url.href, handleCodeInApp: true })
		setCookie('email', email)
	}
</script>

{#if sendingEmail}
	{#await sendingEmail then}
		<p>Sign in link sent to {email}.</p>
	{:catch error}
		<p>Something went wrong: {error.message}</p>
		{@debug error}
	{/await}
{:else}
	<div>
		Email: <input type="email" bind:value={email} />
		<input type="button" value="login" on:click={sendEmailTo} />
	</div>
{/if}
