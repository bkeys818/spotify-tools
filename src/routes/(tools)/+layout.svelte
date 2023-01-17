<script lang="ts">
	import { page } from '$app/stores'
</script>

<svelte:head>
	<title>{$page.data.title}</title>
</svelte:head>

<header>
	<h1>{$page.data.title}</h1>
	<h3>{$page.data.desc}</h3>
</header>
<slot />
