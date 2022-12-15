<script lang="ts">
	import { createAuthorizeURL } from '$lib/spotify';
	import { onMount } from 'svelte'
	import { directedFromPath } from '../cookie'
	import { error } from '@sveltejs/kit';
	import { authorizeTool } from '$lib/firebase/functions'
	import type { PageData } from './$types'
	export let data: PageData

	onMount(async () => {
		if (data.code) {
			const toolPath = directedFromPath.parse(document.cookie)
			if (toolPath) {
				const tool = toolPath.slice(toolPath.lastIndexOf('/') + 1)
				await authorizeTool({ code: data.code, tool })
				location.href = toolPath
			}
			else throw error(404, `I'm lost! Where did you come from?`)
		}
	})

	function authorize() {
		const scopes: string[] = []
		if (location.search) {
			for (const param of location.search.split('&')) {
				const [key, value] = param.split('=')
				if (key == 'scopes') scopes.push(...value.split(' '))
			}
		}
		location.href = createAuthorizeURL(scopes);
	}
</script>

<!-- Spotify Logo -->
<p>In order to use our tools, we need limited access to your Spotify account.</p>
<button class="bg-gray-200 outline-1 px-3 py-2 rounded-lg" on:click={authorize}>Authorize</button>