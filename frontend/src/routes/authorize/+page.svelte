<script lang="ts">
	import { onMount } from 'svelte'
	import { getAllCookies, setTokenCookie } from '$lib/cookie'
	import { parseToken } from '$lib/spotify/auth'
	import { error } from '@sveltejs/kit'

	onMount(async () => {
		// code (response in query) - redirect with code in query
		const searchParams = new URLSearchParams(location.search)
		if (searchParams.has('state')) {
			const path = getPath(searchParams)
			const url = new URL(location.href)
			url.pathname = path
			searchParams.forEach((key, value) => {
				url.searchParams.set(key, value)
			})
			location.href = url.href
		}
		// access token (response in hash) - store token in cookie
		const hashParams = new URLSearchParams(location.hash.slice(1))
		const baseUrl = location.protocol + '//' + location.host
		const url = new URL(getPath(hashParams), baseUrl)
		const { access_token, expires_in } = parseToken(hashParams)
		setTokenCookie(url.pathname, access_token, expires_in)
		location.replace(url.href)
	})

	function getPath(params: URLSearchParams) {
		const { directed_from, state } = getAllCookies()
		if (!state || params.get('state') != state) throw error(400, `Not regonized (state)`)
		params.delete('state')
		if (!directed_from) throw error(400, `I'm lost! Where did you come from?`)
		return directed_from
	}
</script>
