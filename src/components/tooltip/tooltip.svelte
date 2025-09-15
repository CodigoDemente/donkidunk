<script lang="ts">
	import { IconInfoCircle } from '@tabler/icons-svelte';

	export let text: string = '';
	export let size: 'small' | 'medium' | 'large' = 'small';
	export let position: 'top' | 'bottom' | 'left' | 'right' = 'top';
	export let info: boolean = false;
	export let tooltipColor: string = 'text-tertiary';
	export let tooltipSize: string = 'h-4 w-4';

	let show = false;

	const sizeToClass = {
		small: 'text-[10px] font-light p-2',
		medium: 'text-xs font-light p-3',
		large: 'text-xs font-light p-4'
	};

	const positionToClass = {
		top: 'bottom-full left-1/2 -translate-x-1/2 mb-1',
		bottom: 'top-full left-1/2 -translate-x-1/2 mt-1',
		left: 'right-full top-1/2 -translate-y-1/2 mr-2',
		right: 'left-full top-1/2 -translate-y-1/2 ml-2'
	};
</script>

<span class="relative inline-flex">
	<span
		class="flex cursor-pointer items-start justify-start"
		on:mouseenter={() => (show = true)}
		on:mouseleave={() => (show = false)}
		on:focus={() => (show = true)}
		on:blur={() => (show = false)}
		tabindex="0"
	>
		<slot />
		{#if info}
			<IconInfoCircle class="ml-1 {tooltipSize} {tooltipColor}" />
		{/if}
	</span>

	{#if show && text}
		<div
			class={`text-tertiary absolute z-50 w-42 rounded-sm bg-gray-900 shadow-lg ${sizeToClass[size]} ${positionToClass[position]} text-justify`}
			style="box-shadow: 0 2px 8px rgba(0,0,0,0.18);"
		>
			{text}
		</div>
	{/if}
</span>
