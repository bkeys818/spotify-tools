<script lang="ts">
	export let title: string
	export let type: 'playlist' | 'track' | 'album' | 'artist'
	export let id: string
	export let className: string | undefined = undefined
	export let style: string | undefined = undefined
</script>

<iframe
	class={className}
	{style}
	{title}
	src="https://open.spotify.com/embed/{type}/{id}?utm_source=generator"
	width="70%"
	height="80"
	frameBorder="0"
	allowfullscreen={false}
	allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
/>
