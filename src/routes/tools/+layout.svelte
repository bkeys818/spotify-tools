<script lang="ts">
	import { page } from '$app/stores';
</script>

<svelte:head>
	<title>{$page.data.title}</title>
</svelte:head>

<div class="py-6 sm:py-8 lg:py-10" >
	<h1>{$page.data.title}</h1>
	<p>{$page.data.desc}</p>
	<slot />
</div>

