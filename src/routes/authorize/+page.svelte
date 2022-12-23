<script lang="ts">
	import { createAuthorizeURL } from '$lib/spotify'
	import { onMount } from 'svelte'
	import { directedFromPath } from '$lib/cookie'
	import { error } from '@sveltejs/kit'

	onMount(async () => {
		const searchParams = new URLSearchParams(location.search.slice(1))
		// check scope
		if (searchParams.has('code')) {
			const toolPath = directedFromPath.parse(document.cookie)
			if (toolPath) {
				location.href = toolPath + location.search
			} else throw error(404, `I'm lost! Where did you come from?`)
		} else {
			const scopes: string[] = (searchParams.get('scopes') ?? '').split(' ')
			location.href = createAuthorizeURL(scopes, location.origin)
		}
	})
</script>
