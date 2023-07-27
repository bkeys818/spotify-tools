<script lang="ts">
	import { authorize } from '$lib/spotify'
	import { setCookie } from '$lib/cookie'

	export let authType: Parameters<typeof authorize>[0] = 'token'
	export let scopes: string | undefined = undefined
</script>

<button
	class="btn-primary"
	on:click={() => {
		setCookie('directed_from_path', location.pathname)
		authorize(authType, scopes)
	}}>Authorize</button
>
<p class="mt-4">In order to use our tools, we need limited access to your Spotify account.</p>
