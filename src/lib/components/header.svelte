<script lang="ts">
	import { user } from '../stores'
	import { auth } from '$lib/firebase/auth'
	const signOut = () => auth.signOut()
	function goToLogin() {
		location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`
	}
</script>

<nav class="bg-gray-800">
	<div class="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
		<div class="relative flex items-center justify-between h-16">
			<div
				class="absolute inset-y-0 left-0 flex items-center pr-2 sm:static sm:inset-auto sm:mr-6 sm:pl-0"
			>
				<p class="text-2xl font-extragetLoginUrlcking-tight text-white">Spotify Tools</p>
			</div>
			<div class="absolute inset-y-0 right-0 flex items-center">
				{#if $user}
					<button class="text-white" on:click={signOut}>Sign Out</button>
				{:else if $user === null}
					<button class="text-white" on:click={goToLogin}>Login</button>
				{/if}
			</div>
		</div>
	</div>
</nav>
