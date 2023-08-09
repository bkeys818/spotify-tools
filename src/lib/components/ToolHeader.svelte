<script lang="ts">
	import type toolInfo from '../../routes/(tools)/info.json'

	export let info: (typeof toolInfo)[keyof typeof toolInfo]
</script>

<svelte:head>
	<title>{info.title}</title>
</svelte:head>

<header>
	<h1>{info.title}</h1>
	<h3>{info.desc}</h3>
</header>

<slot />
