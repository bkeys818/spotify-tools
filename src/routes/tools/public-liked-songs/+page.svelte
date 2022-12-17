<script lang="ts">
	let playlist: string | undefined = undefined;
</script>

{#if playlist}
	<a href={playlist}>New Playlist!</a>
{/if}
