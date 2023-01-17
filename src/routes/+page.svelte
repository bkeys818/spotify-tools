<script context="module" lang="ts">
	import * as tools from './(tools)'
	let toolsArray = Object.keys(tools).map(key => tools[key as keyof typeof tools])
</script>

<svelte:head>
	<title>Spotify Tools</title>
</svelte:head>

<header>
	<h1>Spotify Tools</h1>
</header>
<ul>
	{#each toolsArray as tool}
		<li>
			<a href={tool.path} class="block container">
				<h2 class="text-left">{tool.title}</h2>
				<h4>{tool.desc}</h4>
			</a>
		</li>
	{/each}
</ul>
