<script lang="ts">
	import { getTextColorForBackground } from '../box/colors';
	import type { Props } from './types';

	let { color, text, disabled, onClick, className }: Props = $props();

	const buttonTextColor = getTextColorForBackground(color);

	function handleClick(e: MouseEvent) {
		if (disabled) {
			e.preventDefault();
			e.stopPropagation();
		}
		if (onClick) onClick(e);
	}
</script>

<button
	class={`inline-flex items-center rounded-xl px-2 py-1 text-xs font-medium ${className} ${!disabled && 'hover:cursor-pointer hover:brightness-120'}`}
	style={`background-color: ${color}; color: ${buttonTextColor};`}
	onclick={handleClick}
	{disabled}
>
	{#if text}
		{text}
	{:else}
		<slot />
	{/if}
</button>
