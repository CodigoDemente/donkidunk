<script lang="ts">
	import type { Category } from '../../modules/board/types/Category';
	import { getHoverBackgroundColor, getTextColorForBackground } from './colors';
	import { timelineContext } from '../../modules/videoplayer/context.svelte';
	import { boardContext } from '../../modules/board/context.svelte';
	import { CategoryType } from './types';
	import type { Button } from '../../modules/board/types/Button';
	import { IconPencil, IconTrash } from '@tabler/icons-svelte';

	const timeline = timelineContext.get();
	const board = boardContext.get();

	type Props = {
		type: CategoryType;
		category: Category;
		draggedCategoryId: number | null;
	};

	let { type, category, draggedCategoryId = $bindable() }: Props = $props();

	const buttonBackgroundColor = category.color;
	const buttonTextColor = getTextColorForBackground(category.color);
	const hoverBackgroundColor = getHoverBackgroundColor(category.color);

	function handleDragStart(e: DragEvent, categoryId: number) {
		e.dataTransfer?.setData('text/plain', 'dragged');
		draggedCategoryId = categoryId;
	}

	function addActionOrEvent(categoryId: number, button: Button): Promise<void> {
		if (type === CategoryType.Action) {
			return timeline.addAction(button, categoryId, timeline.currentTime);
		} else {
			return timeline.addEvent(button.id, categoryId, timeline.currentTime);
		}
	}

	function removeCategory(type: CategoryType, categoryId: number) {
		board.deleteCategory(type, categoryId);
	}
</script>

<!-- Draggable element absolutely positioned by percentage -->
<div
	class="absolute z-10 inline-block min-h-10 cursor-move rounded border border-gray-900 bg-gray-700 px-1 pb-1 text-blue-950 shadow select-none"
	style="
	left: {category.position.x}%;
	top: {category.position.y}%;"
	draggable="true"
	ondragstart={(e) => handleDragStart(e, category.id)}
	role="button"
	aria-grabbed="true"
	tabindex="0"
>
	<div class="flex items-center justify-between gap-2">
		<p class="flex items-center gap-1 text-xs font-semibold text-gray-200">
			<span
				class="rounded-full"
				style="background-color: {category.color}; width: 0.75rem; height: 0.75rem; display: inline-block; margin-right: 0.25rem;"
			></span>
			{category.name}
		</p>
		<div>
			<button class="hover:cursor-pointer" onclick={() => removeCategory(type, category.id)}>
				<IconTrash class="h-3 w-3 text-gray-400 hover:text-white" />
			</button>
			<button class="hover:cursor-pointer" onclick={() => removeCategory(type, category.id)}>
				<IconPencil class="h-3 w-3 text-gray-400 hover:text-white" />
			</button>
		</div>
	</div>
	<div class="flex flex-wrap gap-2">
		{#each category.buttons as button (button.id)}
			<button
				style={`
					background-color: ${buttonBackgroundColor};
					color: ${buttonTextColor};
				`}
				class="rounded-xs px-2 py-1 text-xs
				hover:cursor-pointer
				hover:brightness-110"
				onclick={() => addActionOrEvent(category.id, button)}
			>
				{button.name}
			</button>
		{/each}
	</div>
</div>
