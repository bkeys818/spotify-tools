<script lang="ts">
	import { createAuthorizeURL } from '$lib/spotify';
	import { onMount } from 'svelte';
	import { directedFromPath } from '../cookie';
	import { error } from '@sveltejs/kit';

	onMount(async () => {
		const searchParams = getSearchParams();
		// check scope
		if (searchParams.code) {
			const toolPath = directedFromPath.parse(document.cookie);
			if (toolPath) {
				location.href = toolPath + location.search;
			} else throw error(404, `I'm lost! Where did you come from?`);
		} else {
			const scopes: string[] = (searchParams.scopes ?? '').split(' ');
			location.href = createAuthorizeURL(scopes);
		}
	});
	function getSearchParams() {
		return location.search
			.slice(1)
			.split('&')
			.map((v) => v.split('='))
			.reduce(
				(pre: Partial<Record<string, string>>, [key, value]) => ({ ...pre, [key]: value }),
				{}
			);
	}
</script>
