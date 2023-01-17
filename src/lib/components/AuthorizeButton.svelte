<script lang="ts">
	import { authorize } from '$lib/spotify'
	import { setCookie } from '$lib/cookie'
</script>

<!-- Spotify Logo -->
<button
	class="btn-primary"
	on:click={() => {
		setCookie('directed_from_path', location.pathname)
		authorize('user-library-read playlist-modify-public')
	}}>Authorize</button
>
<p class="mt-4">In order to use our tools, we need limited access to your Spotify account.</p>
