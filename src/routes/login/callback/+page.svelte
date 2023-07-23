<script lang="ts">
	import { onMount } from 'svelte'
	import EmailForm from '$lib/components/EmailForm.svelte'
	import { signInWithEmailLink, isSignInWithEmailLink } from 'firebase/auth'
	import { auth } from '$lib/firebase/auth'
	import { getAllCookies } from '$lib/cookie'

	let email: string | undefined

	onMount(async () => {
		email = getAllCookies().email
	})

	async function signInWith(email: string) {
		const url = location.href
		if (isSignInWithEmailLink(auth, url)) {
			// TODO: catch firebase errors
			await signInWithEmailLink(auth, email, location.href)
			const query = new URLSearchParams(location.search.slice(1))
			const state = query.get('state')
			location.href = state ?? '/'
		} else throw new AccessError(`Url isn't a valid "sign in with email link".`)
	}

	class AccessError extends Error {
		super(message: string) {
			this.super(message)
			this.name = 'AccessError'
		}
	}
</script>

{#if email}
	{#await signInWith(email) catch error}
		<p>Something went wrong: {error.message}</p>
	{/await}
{:else}
	<EmailForm
		onSumbit={value => {
			email = value
		}}
	/>
	<p class="mt-4 text-center">Just making sure it's it you!</p>
{/if}
