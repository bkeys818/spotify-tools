<script lang="ts">
	import { authorize } from '$lib/spotify/auth'
	import { setCookie } from '$lib/cookie'

	export let authType: Parameters<typeof authorize>[0] = 'token'
	export let scopes: string | undefined = undefined
</script>

<button
	class="btn-primary"
	on:click={() => {
		let url = location.pathname
		if (location.search) url += location.search
		if (location.hash) url += location.hash
		setCookie('directed_from', url)
		authorize(authType, scopes)
	}}>Authorize</button
>
<p class="mt-4">In order to use our tools, we need limited access to your Spotify account.</p>
