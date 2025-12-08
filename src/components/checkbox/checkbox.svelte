<script lang="ts">
	import type { CheckboxProps } from './types';
	let {
		checked = $bindable(false),
		onChange,
		disabled = false,
		className = '',
		label = '',
		name = '',
		id = ''
	}: CheckboxProps = $props();

	function handleChange(e: Event) {
		if (disabled) return;
		const newChecked = !checked;
		checked = newChecked;
		if (onChange) onChange(newChecked);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (disabled) return;
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			handleChange(e);
		}
	}
</script>

<label
	class={`flex items-center gap-2 ${className} ${disabled ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
	{id}
>
	<button
		type="button"
		role="checkbox"
		aria-checked={checked}
		aria-label={label || 'checkbox'}
		tabindex={disabled ? -1 : 0}
		class="relative flex h-4 w-4 items-center justify-center rounded border-2 transition-all duration-200 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none disabled:pointer-events-none
		${checked ? 'border-violet-500 bg-violet-500' : 'border-gray-500 bg-gray-700 hover:border-gray-400'}
		${disabled ? 'opacity-50' : ''}"
		onclick={handleChange}
		onkeydown={handleKeydown}
		{disabled}
		{name}
	>
		{#if checked}
			<svg
				class="h-3 w-3 text-white"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"
				></path>
			</svg>
		{/if}
	</button>
	{#if label}
		<span class="text-sm text-gray-200 select-none">{label}</span>
	{/if}
</label>
