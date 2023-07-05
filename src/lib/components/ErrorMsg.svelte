<script lang="ts">
	export let error: unknown
	function hasKeys<K extends string>(
		value: object,
		...keys: K[]
	): value is { [key in K]: unknown } {
		for (const key of keys) if (!(key in value)) return false
		return true
	}
</script>

<div>
	<h4>Oh No! Something went wrong</h4>
	{#if typeof error === 'object' && error !== null && hasKeys(error, 'code')}
		{#if typeof error.code == 'string' && error.code.includes('internal')}
			<p>Internal Error</p>
		{:else}
			{#if hasKeys(error, 'message')}
				<p>{error.message}</p>
			{/if}
			<h6>Code: {error.code}</h6>
		{/if}
	{:else}
		<p>Uknown Error</p>
		{@debug error}
	{/if}
</div>
