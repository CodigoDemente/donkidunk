<script lang="ts">
	import { IconInfoCircle } from '@tabler/icons-svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		text?: string;
		size?: 'small' | 'medium' | 'large';
		position?: 'top' | 'bottom' | 'left' | 'right';
		info?: boolean;
		tooltipColor?: string;
		tooltipSize?: string;
		disabled?: boolean;
		children: Snippet;
	}

	let {
		text = '',
		size = 'small',
		position = 'top',
		info = false,
		tooltipColor = 'text-tertiary',
		tooltipSize = 'h-4 w-4',
		disabled = false,
		children
	}: Props = $props();

	const MARGIN = 8;

	let show = $state(false);
	let tooltipRef: HTMLDivElement | null = $state(null);
	let containerRef: HTMLSpanElement | null = $state(null);
	let positionOverride: typeof position | null = $state(null);
	let alignRight = $state(false);
	let alignLeft = $state(false);
	const adjustedPosition = $derived(positionOverride ?? position);

	const sizeToClass = {
		small: 'text-[10px] font-light px-2 py-1',
		medium: 'text-xs font-light px-3 py-2',
		large: 'text-xs font-light px-4 py-2'
	};

	// Adjust position if tooltip would overflow viewport
	$effect(() => {
		if (show && tooltipRef && containerRef) {
			const tooltipRect = tooltipRef.getBoundingClientRect();
			const containerRect = containerRef.getBoundingClientRect();
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;

			let newPosition = position;
			let newAlignRight = false;
			let newAlignLeft = false;

			// Check vertical overflow (for top/bottom positions)
			if (position === 'top' && tooltipRect.top < MARGIN) {
				newPosition = 'bottom';
			} else if (position === 'bottom' && tooltipRect.bottom > viewportHeight - MARGIN) {
				newPosition = 'top';
			}

			// Check horizontal overflow (for left/right positions)
			if (position === 'left' && tooltipRect.left < MARGIN) {
				newPosition = 'right';
			} else if (position === 'right' && tooltipRect.right > viewportWidth - MARGIN) {
				newPosition = 'left';
			}

			// For top/bottom positions, check if tooltip overflows left or right edges
			const effectivePosition = newPosition !== position ? newPosition : position;
			if (effectivePosition === 'top' || effectivePosition === 'bottom') {
				if (containerRect.left + tooltipRect.width > viewportWidth - MARGIN) {
					// Would overflow right edge - align to right
					newAlignRight = true;
				} else if (containerRect.right - tooltipRect.width < MARGIN) {
					// Would overflow left edge - align to left
					newAlignLeft = true;
				}
			}

			positionOverride = newPosition !== position ? newPosition : null;
			alignRight = newAlignRight;
			alignLeft = newAlignLeft;
		}
	});

	// Reset adjustments when tooltip closes
	$effect(() => {
		if (!show) {
			positionOverride = null;
			alignRight = false;
			alignLeft = false;
		}
	});

	// Build position classes dynamically
	const positionClasses = $derived(() => {
		const pos = adjustedPosition;
		if (pos === 'top' || pos === 'bottom') {
			const vertical = pos === 'top' ? 'bottom-full mb-1' : 'top-full mt-1';
			if (alignRight) {
				return `${vertical} right-0`;
			} else if (alignLeft) {
				return `${vertical} left-0`;
			} else {
				return `${vertical} left-1/2 -translate-x-1/2`;
			}
		} else if (pos === 'left') {
			return 'right-full top-1/2 -translate-y-1/2 mr-2';
		} else {
			return 'left-full top-1/2 -translate-y-1/2 ml-2';
		}
	});
</script>

<span bind:this={containerRef} class="relative inline-flex">
	<span
		class="flex cursor-pointer items-start justify-start"
		onmouseenter={() => (show = true)}
		onmouseleave={() => (show = false)}
		onfocus={() => (show = true)}
		onblur={() => (show = false)}
		role="button"
		tabindex="0"
		aria-label="Show tooltip"
	>
		{@render children()}
		{#if info}
			<IconInfoCircle class="ml-1 {tooltipSize} {tooltipColor}" />
		{/if}
	</span>

	{#if show && text && !disabled}
		<div
			bind:this={tooltipRef}
			class={`absolute z-50 w-max max-w-xs rounded-sm bg-gray-900 whitespace-nowrap text-white shadow-lg ${sizeToClass[size]} ${positionClasses()}`}
			style="box-shadow: 0 2px 8px rgba(0,0,0,0.18);"
		>
			{text}
		</div>
	{/if}
</span>
