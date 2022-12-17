<script>
	import { page } from '$app/stores';
	import { createAuthorizeURL } from '$lib/spotify';
</script>

<svelte:head>
	<title>{$page.data.title}</title>
</svelte:head>

<h1>{$page.data.title}</h1>
<p>{$page.data.desc}</p>

{#if 'scopes' in $page.data}
	Spotify Logo
	<p>In order to use our tools, we need limited access to your Spotify account.</p>
	<button
		class="bg-gray-200 outline-1 px-3 py-2 rounded-lg"
		on:click={() => {
			location.href = createAuthorizeURL($page.data.scopes);
		}}>Authorize</button
	>
{/if}

<slot />
