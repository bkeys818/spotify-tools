<script lang="ts">
	import { onMount } from 'svelte'

	export let playlistId: string

	onMount(() => {
		const id = new URLSearchParams(location.search).get('id')
		if (id) playlistId = id
		else location.href = location.pathname.slice(0, location.pathname.lastIndexOf('/'))
	})
</script>

<p>{playlistId}</p>
