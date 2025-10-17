<script lang="ts">
	import type { ToggleProps } from './types';
	let {
		checked,
		onChange,
		disabled = false,
		className = '',
		labelTruthy = '',
		labelFalsy = ''
	}: ToggleProps = $props();

	function handleToggle(e: MouseEvent | KeyboardEvent) {
		if (disabled) return;
		if (onChange) onChange(!checked);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (disabled) return;
		if ((e.ctrlKey || e.metaKey) && (e.key === 'e' || e.key === 'E')) {
			e.preventDefault();
			handleToggle(e);
		}
		if (e.key === ' ' || e.key === 'Enter') {
			e.preventDefault();
			handleToggle(e);
		}
	}
</script>

<div class={`ml-1 flex items-center gap-2 py-2 ${className}`}>
	{#if labelFalsy}
		<span class="text-xs select-none">{labelFalsy}</span>
	{/if}
	<button
		type="button"
		aria-pressed={checked}
		aria-label="toggle"
		tabindex={disabled ? -1 : 0}
		class="relative h-4 w-8 rounded-full bg-orange-500 transition-colors duration-200 focus:outline-none disabled:pointer-events-none disabled:opacity-50"
		onclick={handleToggle}
		onkeydown={handleKeydown}
		{disabled}
	>
		<span
			class="absolute top-0 left-0 h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-200"
			style={`transform: translateX(${checked ? '1rem' : '0'});`}
		></span>
	</button>
	{#if labelTruthy}
		<span class="text-xs select-none">{labelTruthy}</span>
	{/if}
</div>
