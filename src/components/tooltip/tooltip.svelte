<script lang="ts">
	import { IconInfoCircle } from '@tabler/icons-svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		text?: string;
		size?: 'mini' | 'small' | 'medium' | 'large';
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
	const TOOLTIP_GAP = 4;

	let show = $state(false);
	let tooltipRef: HTMLDivElement | null = $state(null);
	let triggerRef: HTMLSpanElement | null = $state(null);
	let tooltipStyle = $state('');

	const sizeToClass = {
		mini: 'text-xs font-light px-1 py-0.5',
		small: 'text-xs font-light px-2 py-1',
		medium: 'text-sm font-light px-3 py-2',
		large: 'text-sm font-light px-4 py-2'
	};

	// Calculate tooltip position using fixed positioning
	$effect(() => {
		if (show && tooltipRef && triggerRef) {
			const triggerRect = triggerRef.getBoundingClientRect();
			const tooltipRect = tooltipRef.getBoundingClientRect();
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;

			let finalPosition = position;

			// Check if preferred position would overflow and flip if needed
			if (position === 'top' && triggerRect.top - tooltipRect.height - TOOLTIP_GAP < MARGIN) {
				finalPosition = 'bottom';
			} else if (
				position === 'bottom' &&
				triggerRect.bottom + tooltipRect.height + TOOLTIP_GAP > viewportHeight - MARGIN
			) {
				finalPosition = 'top';
			} else if (
				position === 'left' &&
				triggerRect.left - tooltipRect.width - TOOLTIP_GAP < MARGIN
			) {
				finalPosition = 'right';
			} else if (
				position === 'right' &&
				triggerRect.right + tooltipRect.width + TOOLTIP_GAP > viewportWidth - MARGIN
			) {
				finalPosition = 'left';
			}

			let top;
			let left;

			// Calculate coordinates based on final position
			if (finalPosition === 'top') {
				top = triggerRect.top - tooltipRect.height - TOOLTIP_GAP;
				left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
			} else if (finalPosition === 'bottom') {
				top = triggerRect.bottom + TOOLTIP_GAP;
				left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
			} else if (finalPosition === 'left') {
				top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
				left = triggerRect.left - tooltipRect.width - TOOLTIP_GAP;
			} else {
				// right
				top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
				left = triggerRect.right + TOOLTIP_GAP;
			}

			// Clamp horizontal position to viewport
			if (left < MARGIN) {
				left = MARGIN;
			} else if (left + tooltipRect.width > viewportWidth - MARGIN) {
				left = viewportWidth - tooltipRect.width - MARGIN;
			}

			// Clamp vertical position to viewport
			if (top < MARGIN) {
				top = MARGIN;
			} else if (top + tooltipRect.height > viewportHeight - MARGIN) {
				top = viewportHeight - tooltipRect.height - MARGIN;
			}

			tooltipStyle = `top: ${top}px; left: ${left}px;`;
		}
	});

	// Reset when tooltip closes
	$effect(() => {
		if (!show) {
			tooltipStyle = '';
		}
	});
</script>

<span class="inline-flex">
	<span
		bind:this={triggerRef}
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
			class={`fixed z-50 max-w-xs rounded-sm bg-gray-900 text-white shadow-lg ${sizeToClass[size]}`}
			style="box-shadow: 0 2px 8px rgba(0,0,0,0.18); {tooltipStyle}"
		>
			{text}
		</div>
	{/if}
</span>
