<script context="module" lang="ts">
	import toolInfo from './(tools)/info.json'
</script>

<svelte:head>
	<title>Spotify Tools</title>
</svelte:head>

<header>
	<h1>Spotify Tools</h1>
</header>
<ul>
	{#each Object.entries(toolInfo) as [id, { title, desc }] (id)}
		<li>
			<a href={'./' + id} class="block container">
				<h2 class="text-left">{title}</h2>
				<h4>{desc}</h4>
			</a>
		</li>
	{/each}
</ul>
