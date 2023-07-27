<script lang="ts">
	// import { createAuthorizeFunc } from '$lib/spotify'
	import { onMount } from 'svelte'
	import { getAllCookies } from '$lib/cookie'
	import { error } from '@sveltejs/kit'

	onMount(async () => {
		const cookies = getAllCookies()
		const searchParams = new URLSearchParams(
			location[location.search == '' ? 'hash' : 'search'].slice(1)
		)
		if (cookies.state && cookies.state == searchParams.get('state')) {
			searchParams.delete('state')
			const { directed_from_path } = getAllCookies()
			if (directed_from_path)
				location.href = directed_from_path + '?' + searchParams.toString()
		}
		throw error(404, `I'm lost! Where did you come from?`)
	})
</script>
