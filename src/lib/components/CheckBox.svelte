<script lang="ts">
	export let id: string
	export let value: string = id
	export let label: string | undefined = undefined
	export let size: 'lg' | 'md' | 'sm' = 'md'
	export let checked = false

	const sizeClass = size == 'md' ? '' : (`size-${size}` as const)
</script>

<div class="relative">
	<input type="checkbox" {id} {value} class="hidden" bind:checked />
	<label for={id} class="inline">
		<span class={`checkbox ${sizeClass}`}>
			<svg
				viewBox="0 0 12 9"
				fill="none"
				stroke="white"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-dasharray="16"
				stroke-dashoffset="16"
			>
				<polyline points="1 5 4 8 11 1" />
			</svg>
		</span>
		{#if label}
			<span class="label">{label}</span>
		{/if}
	</label>
</div>

<style lang="postcss">
	label {
		@apply flex items-center gap-1.5;
	}

	.checkbox {
		@apply relative inline-block h-6 w-6 rounded-full cursor-pointer;
		transform: scale(1);
		transition: all 0.2s ease;
		border: 1px solid rgb(204, 204, 204);

		&:before {
			@apply block w-full h-full rounded-full;
			content: '';
			background: #506eec;
			transform: scale(0);
			opacity: 1;
			transition-delay: 0.2s;
		}

		& svg {
			@apply absolute z-10 top-1/2 left-1/2;
			transform: translate(-50%, -45%);
			width: 55%;
			height: 40%;
			stroke-width: 2;
			transition: all 0.3s ease;
			transition-delay: 0.1s;
		}

		&.size-sm {
			@apply h-5 w-5;
			& + .label {
				@apply text-sm;
			}
		}
		&.size-lg {
			@apply h-7 w-7;
			& + .label {
				@apply text-lg;
			}
		}
	}

	input:checked + label {
		& .checkbox {
			border-color: #3c53c7;
			background: #3c53c7;
			animation: overshoot 0.6s ease;
			& svg {
				stroke-dashoffset: 0;
			}
			&:before {
				transform: scale(1.8);
				opacity: 0;
				transition: all 0.6s ease;
			}
		}
	}

	@keyframes overshoot {
		50% {
			transform: scale(1.2);
		}
	}
</style>
