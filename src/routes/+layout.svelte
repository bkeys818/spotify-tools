<script>
	import '../app.css'
	import Header from '$lib/components/header.svelte'
</script>

<Header />

<main class='max-w-4xl mx-auto px-4 my-4 sm:my-2 lg:my-8'>
	<slot />
</main>
