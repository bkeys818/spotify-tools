<script lang="ts">
	import { onMount } from 'svelte'
	import { user } from '$lib/stores'

	let url: string

	onMount(() => {
		url = '/login?redirect=' + encodeURIComponent(location.pathname)
	})
</script>

{#if $user === undefined}
	<!-- loading state -->
{:else if $user == null}
	<a href={url} class="btn-primary">Login</a>
	<p class="mt-4">Log in to use our tools</p>
{:else}
	<slot />
{/if}
