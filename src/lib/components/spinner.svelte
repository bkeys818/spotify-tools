<script lang="ts">
	export let borderWidth: number = 6;
</script>

<div class="spin-ring">
    {#each Array(4) as _}
        <div style="--border-width: {borderWidth}px" />
    {/each}
</div>

<style>
	.spin-ring {
		display: inline-block;
		position: relative;
		width: 80px;
		height: 80px;
		animation: spin 12s linear infinite;
	}

	@keyframes spin {
		100% {
			-webkit-transform: rotate(360deg);
			transform: rotate(360deg);
		}
	}

	.spin-ring div {
		box-sizing: border-box;
		display: block;
		position: absolute;
		width: 80%;
		height: 80%;
		margin: 10%;
		border: var(--border-width) solid rgba(255, 255, 255, 0);
		border-top-color: calc(var(--border-width) / 2) solid #7fc4d1;
		border-right-color: calc(var(--border-width) / 2) solid #7fc4d1;
		border-radius: 50%;
		animation: spin-ring 3s cubic-bezier(0.40, 0.05, 0.6, 0.95) infinite;
		/* border-color: #fff transparent transparent transparent; */
	}
	.spin-ring div:nth-child(1) {
		animation-delay: -0.36s;
	}
	.spin-ring div:nth-child(2) {
		animation-delay: -0.24s;
	}
	.spin-ring div:nth-child(3) {
		animation-delay: -0.12s;
	}

	@keyframes spin-ring {
		0% {
			-webkit-transform: rotate(0deg);
			transform: rotate(0deg);
			border-top-color: #7fc4d1;
			border-right-color: #7fc4d1;
		}

		50% {
			border-top-color: #1f4f58;
			border-right-color: #1f4f58;
		}

		100% {
			-webkit-transform: rotate(720deg);
			transform: rotate(720deg);
			border-top-color: #7fc4d1;
			border-right-color: #7fc4d1;
		}
	}
</style>
