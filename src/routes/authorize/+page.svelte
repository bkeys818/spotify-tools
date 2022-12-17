<script lang="ts">
	import { createAuthorizeURL } from '$lib/spotify';
	import { onMount } from 'svelte'
	import { directedFromPath } from '../cookie'
	import { error } from '@sveltejs/kit';
	import { authorizeTool } from '$lib/firebase/functions'

	onMount(async () => {
		const searchParams = getSearchParams()
		// check scope
		if (searchParams.code) {
			const toolPath = directedFromPath.parse(document.cookie)
			if (toolPath) {
				const tool = toolPath.slice(toolPath.lastIndexOf('/') + 1)
				await authorizeTool({ code: searchParams.code, tool })
				location.href = toolPath
			}
			else throw error(404, `I'm lost! Where did you come from?`)
		}
	})

	function authorize() {
		const searchParams = getSearchParams()
		const scopes: string[] = (searchParams.scopes ?? '').split(' ')
		location.href = createAuthorizeURL(scopes);
	}

	function getSearchParams() {
		return location.search
			.slice(1)
			.split('&')
			.map((v) => v.split('='))
			.reduce((pre: Partial<Record<string,string>>, [key, value]) => ({ ...pre, [key]: value }), {});
	}
</script>

<!-- Spotify Logo -->
<p>In order to use our tools, we need limited access to your Spotify account.</p>
<button class="bg-gray-200 outline-1 px-3 py-2 rounded-lg" on:click={authorize}>Authorize</button>