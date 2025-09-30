<script lang="ts">
	import type { Category } from '../../modules/board/types/Category';
	import { getTextColorForBackground } from './colors';
	import { timelineContext } from '../../modules/videoplayer/context.svelte';
	import { CategoryType } from './types';

	const timeline = timelineContext.get();

	type Props = {
		type: CategoryType;
		currentTime: number;
		category: Category;
		draggedCategoryId: number | null;
	};

	let { type, category, currentTime, draggedCategoryId = $bindable() }: Props = $props();

	function handleDragStart(e: DragEvent, categoryId: number) {
		e.dataTransfer?.setData('text/plain', 'dragged');
		draggedCategoryId = categoryId;
	}

	function addActionOrEvent(categoryId: number, buttonId: number): Promise<void> {
		if (type === CategoryType.Action) {
			return timeline.addAction(buttonId, categoryId, currentTime);
		} else {
			return timeline.addEvent(buttonId, categoryId, currentTime);
		}
	}
</script>

<!-- Draggable element absolutely positioned by percentage -->
<div
	class="absolute z-10 inline-block min-h-10 cursor-move rounded p-2 shadow select-none"
	style="
					background-color: {category.color};
					color: {getTextColorForBackground(category.color)};
					left: {category.position.x}%;
					top: {category.position.y}%;"
	draggable="true"
	ondragstart={(e) => handleDragStart(e, category.id)}
	role="button"
	aria-grabbed="true"
	tabindex="0"
>
	<div>{category.name}</div>
	<div class="mt-2 flex flex-wrap gap-2">
		{#each category.buttons as button (button.id)}
			<button
				class="rounded bg-gray-600 px-2 py-1 text-xs text-white hover:bg-gray-500"
				onclick={() => addActionOrEvent(category.id, button.id)}
			>
				{button.name}
			</button>
		{/each}
	</div>
</div>
