<script lang="ts">
	import type { Category } from '../../modules/board/types/Category';
	import { getHoverBackgroundColor, getTextColorForBackground } from './colors';
	import { timelineContext } from '../../modules/videoplayer/context.svelte';
	import { CategoryType } from './types';

	const timeline = timelineContext.get();

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

	function addActionOrEvent(categoryId: number, buttonId: number): Promise<void> {
		if (type === CategoryType.Action) {
			return timeline.addAction(buttonId, categoryId, timeline.currentTime);
		} else {
			return timeline.addEvent(buttonId, categoryId, timeline.currentTime);
		}
	}
</script>

<!-- Draggable element absolutely positioned by percentage -->
<div
	class="bg-secondary absolute z-10 inline-block min-h-10 cursor-move rounded p-2 text-blue-950 shadow select-none"
	style="
	left: {category.position.x}%;
	top: {category.position.y}%;
	--button-bg-hover-color: {hoverBackgroundColor};
	--button-bg-color: {buttonBackgroundColor};
	--button-text-color: {buttonTextColor};"
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
				class="rounded px-2 py-1 text-xs"
				onclick={() => addActionOrEvent(category.id, button.id)}
			>
				{button.name}
			</button>
		{/each}
	</div>
</div>

<style>
	button {
		background-color: var(--button-bg-color);
		color: var(--button-text-color);
	}

	button:hover {
		background-color: var(--button-bg-hover-color);
	}
</style>
