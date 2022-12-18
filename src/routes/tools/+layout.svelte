<script lang="ts">
	import { page } from '$app/stores';
	import { navigateToAuthorize } from '../authorize/link';
	import { onMount } from 'svelte';
	import { authorizeTool } from '$lib/firebase/functions'

	onMount(async () => {
		const searchParams = getSearchParams()
		if (searchParams.code) {
			const tool = location.pathname.slice(location.pathname.lastIndexOf('/') + 1)
			await authorizeTool({ code: searchParams.code, tool })
		}
	})

	function getSearchParams() {
		return location.search
			.slice(1)
			.split('&')
			.map((v) => v.split('='))
			.reduce((pre: Partial<Record<string,string>>, [key, value]) => ({ ...pre, [key]: value }), {});
	}
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
			navigateToAuthorize($page.data.scopes);
		}}>Authorize</button
	>
{/if}

<slot />
