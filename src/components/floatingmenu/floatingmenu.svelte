<script lang="ts">
	import { IconCheck } from '@tabler/icons-svelte';
	import type { Props, FloatingMenuOption } from './types';
	import Tooltip from '../tooltip/tooltip.svelte';

	let {
		trigger,
		options = [],
		selectedValue = undefined,
		onoptionselected = () => {},
		triggerClass = '',
		iconClass = 'h-5 w-5',
		menuClass = '',
		disabled = false,
		tooltip = ''
	}: Props = $props();

	const MARGIN = 8;

	let open = $state(false);
	let menuRef: HTMLDivElement | null = $state(null);
	let triggerRef: HTMLButtonElement | null = $state(null);
	let alignRight = $state(false);
	let openUpward = $state(false);

	function handleOptionClick(option: FloatingMenuOption) {
		onoptionselected(option);
		open = false;
	}

	function handleClickOutside(event: MouseEvent) {
		if (
			menuRef &&
			triggerRef &&
			!menuRef.contains(event.target as Node) &&
			!triggerRef.contains(event.target as Node)
		) {
			open = false;
		}
	}

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			open = false;
		}
	}

	function toggleMenu() {
		open = !open;
	}

	// Adjust alignment after menu renders based on viewport bounds
	$effect(() => {
		if (open && menuRef && triggerRef) {
			const menuRect = menuRef.getBoundingClientRect();
			const triggerRect = triggerRef.getBoundingClientRect();
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;

			// Check if menu overflows right edge
			alignRight = triggerRect.left + menuRect.width > viewportWidth - MARGIN;

			// Check if menu overflows bottom edge
			openUpward = triggerRect.bottom + menuRect.height > viewportHeight - MARGIN;
		}
	});

	$effect(() => {
		if (open) {
			document.addEventListener('click', handleClickOutside);
			document.addEventListener('keydown', handleKeyDown);
		}

		return () => {
			document.removeEventListener('click', handleClickOutside);
			document.removeEventListener('keydown', handleKeyDown);
		};
	});
</script>

{#snippet triggerButton()}
	<button
		bind:this={triggerRef}
		type="button"
		class={`flex items-center justify-center rounded p-1.5 text-sm transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50 ${triggerClass}`}
		onclick={toggleMenu}
		{disabled}
		aria-haspopup="menu"
		aria-expanded={open}
	>
		{#if typeof trigger === 'string'}
			{trigger}
		{:else}
			{@const TriggerIcon = trigger}
			<TriggerIcon class={iconClass} />
		{/if}
	</button>
{/snippet}

<div class="relative inline-flex">
	{#if tooltip}
		<Tooltip text={tooltip} size="small" position="bottom" disabled={open}>
			{@render triggerButton()}
		</Tooltip>
	{:else}
		{@render triggerButton()}
	{/if}

	{#if open}
		<div
			bind:this={menuRef}
			class={`absolute z-50 mt-1 min-w-[180px] overflow-hidden rounded border border-gray-700 bg-gray-800 py-1 shadow-lg
				${alignRight ? 'right-0' : 'left-0'}
				${openUpward ? 'bottom-full mb-1' : 'top-full'}
				${menuClass}`}
			role="menu"
		>
			{#each options as option (option.id)}
				<button
					type="button"
					class={`flex w-full cursor-pointer items-center gap-2 px-3 py-1.5 text-left text-sm text-white transition-colors hover:bg-gray-700 ${
						selectedValue === option.value ? 'bg-gray-700/50' : ''
					}`}
					role="menuitem"
					onclick={() => handleOptionClick(option)}
				>
					<span class="w-4 shrink-0">
						{#if selectedValue === option.value}
							<IconCheck size={16} />
						{/if}
					</span>
					<span>{option.label}</span>
				</button>
			{/each}
		</div>
	{/if}
</div>
