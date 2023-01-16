<script lang="ts">
	export let onSumbit: (email: string) => void
	export let disabled: boolean = false
	let email: string
</script>

<form
	action="javascript:void(0);"
	class="w-fit mx-auto p-4 bg-slate-50 border-[1px] border-gray-300 rounded-md"
>
	<div class="mb-6 w-fit mx-auto">
		<label for="email" class="block text-spotify-gray-600 text-sm font-bold mb-2">Email</label>
		<input
			type="email"
			bind:value={email}
			{disabled}
			class="shadow appearance-none border rounded py-2 px-3 text-spotify-gray-600 leading-tight focus:outline-none focus:shadow-outline"
		/>
	</div>
	<button
		on:click={() => onSumbit(email)}
		disabled={disabled || !email}
		class="btn-secondary w-full"
	>
		Login
	</button>
</form>
