<script lang="ts">
	import { getTextColorForBackground } from '../../modules/board/utils/colors';
	import type { Props } from './types';

	let { color, text, disabled, onClick, className, mini }: Props = $props();

	const buttonTextColor = $derived(getTextColorForBackground(color));

	function handleClick(e: MouseEvent) {
		if (disabled) {
			e.preventDefault();
			e.stopPropagation();
		}
		if (onClick) onClick(e);
	}
</script>

<button
	class={`inline-flex items-center rounded-xl ${mini ? `px-1 py-0.5 text-xs` : `px-2 py-1 text-sm`} 
	font-medium ${className} ${!disabled && 'hover:cursor-pointer hover:brightness-120'}`}
	style={`background-color: ${color}; color: ${buttonTextColor};`}
	onclick={handleClick}
	{disabled}
>
	{#if text}
		{text}
	{/if}
</button>
