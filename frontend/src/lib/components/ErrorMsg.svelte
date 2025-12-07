<script lang="ts">
	import { fade, scale } from 'svelte/transition'
	import { error } from '$lib/stores'
	import type { FunctionsErrorCode } from 'firebase/functions'

	let title = 'Uknown Error'
	let message: string | undefined
	let details: unknown

	$: {
		if ($error) {
			if (typeof $error == 'string') {
				title = 'Error!'
				message = $error
			} else if (typeof $error == 'object') {
				if (isFirebaseError(error)) {
					title = 'Firebase Error'
					message = `${error.message} (${error.code})`
					if (error.details) details = details
				} else {
					if ('name' in $error && typeof $error.name == 'string') {
						title = $error.name
						delete $error.name
					} else {
						title = 'Error!'
					}
					if ('message' in $error && typeof $error.message == 'string') {
						message = $error.message
						delete $error.message
					}
					details = 'details' in $error ? $error.details : JSON.stringify($error)
				}
			}
			if (Object.values($error).length > 0) details = JSON.stringify($error)
			console.error(message)
			console.log(details)
		}
	}

	function isFirebaseError(error: object): error is FirebaseError {
		return 'name' in error && error.name == 'FirebaseError'
	}
	interface FirebaseError extends Error {
		name: 'FirebaseError'
		code: FunctionsErrorCode
		details: unknown
	}
</script>

{#if $error}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<div class="popup" transition:fade={{ duration: 300 }}>
		<div on:click={() => location.reload()} />
		<div transition:scale={{ duration: 300, delay: 50, start: 0.4, opacity: 0.3 }}>
			<h4 class="font-bold text-red-600">{title}</h4>
			{#if message}
				<p>{message}</p>
			{/if}
			{#if details}
				<h6>{details}</h6>
			{/if}
		</div>
	</div>
{/if}

<style lang="postcss">
	.popup {
		@apply fixed top-16 left-0 bottom-0 right-0;
	}
	.popup div:first-child {
		@apply fixed top-16 left-0 bottom-0 right-0 bg-black opacity-30 -z-10;
	}
	.popup div:last-child {
		@apply max-w-md max-h-80 overflow-hidden mx-auto mt-4 md:mt-8 px-4 py-6 rounded-md bg-white z-10 drop-shadow text-center;
		border: 2px solid theme(colors.red.600);
	}
</style>
