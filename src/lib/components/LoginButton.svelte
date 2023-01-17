<script lang="ts">
	import { onMount } from 'svelte'

	let url: string
	onMount(() => {
		url = '/login?redirect=' + encodeURIComponent(location.pathname)
	})
</script>

<a href={url} class="btn-primary">Login</a>
<p class="mt-4">Log in to use our tools</p>
