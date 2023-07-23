<script lang="ts">
	import { onMount } from 'svelte'
	import type { FunctionsErrorCode } from 'firebase/functions'

	export let error: unknown

	let msg = 'Uknown Error'
	let details: string | undefined

	onMount(() => {
		if (typeof error == 'object' && error !== null) {
			if (isFirebaseError(error)) {
				msg = error.message
				if (typeof error.details == 'string') details = error.details
			} else if ('message' in error && typeof error.message == 'string') {
				msg = error.message
			} else details = JSON.stringify(error)
		} else if (typeof error == 'string') {
			msg = error
		}
		console.error(error, details)
	})

	function isFirebaseError(error: object): error is FirebaseError {
		return 'name' in error && error.name == 'FirebaseError'
	}
	interface FirebaseError extends Error {
		code: FunctionsErrorCode
		details: unknown
	}
</script>

<div class="mx-auto max-w-md">
	<div class="m-4 p-3 border-red-700 border-2 border-opacity-70 rounded-md">
		<h4>Oh No! Something went wrong</h4>
		<p>{msg}</p>
		{#if details}
			<h6>{details}</h6>
		{/if}
	</div>
</div>
