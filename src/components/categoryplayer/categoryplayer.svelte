<script lang="ts">
	import { IconPlayerSkipForward } from '@tabler/icons-svelte';
	import Tooltip from '../tooltip/tooltip.svelte';
	import type { Category } from '../../modules/board/types/Category';

	type Props = {
		category: Category | undefined;
		isActive?: boolean;
		onPlay?: () => void;
	};

	let { category, isActive = false, onPlay }: Props = $props();
</script>

<div
	class="flex h-5 w-[var(--spacing-category-name-width)] max-w-[var(--spacing-category-name-width)] min-w-[var(--spacing-category-name-width)] items-center gap-2"
>
	<!-- Category name tag -->
	<Tooltip text={category?.name || 'Unknown'} position="right" size="large">
		<div
			class="flex h-5 w-[110px] items-center justify-start overflow-hidden rounded-xs border border-gray-700 bg-gray-800 px-2"
			style="background-color: {category?.color}20; border-color: {category?.color}40;"
		>
			<div class="flex min-w-0 items-center gap-2">
				<span
					class="shrink-0 rounded-full"
					style="background-color: {category?.color}; width: 0.5rem; height: 0.5rem; display: inline-block;"
				></span>
				<span class="min-w-0 truncate text-xs font-medium text-gray-200">
					{category?.name || 'Unknown'}
				</span>
			</div>
		</div>
	</Tooltip>

	<!-- Play button -->
	<div
		role="button"
		tabindex="0"
		class="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded-xs border bg-gray-800 text-gray-400 transition-colors hover:bg-gray-700 hover:text-gray-300 {isActive
			? 'border-primary'
			: 'border-gray-700'}"
		aria-label="Play all category events"
		onclick={(e) => {
			e.stopPropagation();
			onPlay?.();
		}}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				e.stopPropagation();
				onPlay?.();
			}
		}}
	>
		<IconPlayerSkipForward class="h-3 w-3" />
	</div>
</div>
