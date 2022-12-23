<script lang="ts">
	import { createAuthorizeURL } from '$lib/spotify'
	import { onMount } from 'svelte'
	import * as cookie from '$lib/cookie' 
	import { error } from '@sveltejs/kit'

	onMount(async () => {
		const searchParams = new URLSearchParams(location.search.slice(1))
		// check scope
		if (searchParams.has('code')) {
			const directedFromPath = cookie.getAll().directed_from_path
			if (directedFromPath) {
				location.href = directedFromPath + location.search
			} else throw error(404, `I'm lost! Where did you come from?`)
		} else {
			const scopes: string[] = (searchParams.get('scopes') ?? '').split(' ')
			location.href = createAuthorizeURL(scopes, location.origin)
		}
	})
</script>
