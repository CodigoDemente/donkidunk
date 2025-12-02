<script lang="ts">
	import type { Category } from '../../modules/board/types/Category';
	import { timelineContext } from '../../modules/videoplayer/context.svelte';
	import { boardContext } from '../../modules/board/context.svelte';
	import { CategoryType, type DraggedCategory } from './types';
	import type { Button } from '../../modules/board/types/Button';
	import { IconPencil, IconTrash } from '@tabler/icons-svelte';
	import { getTextColorForBackground } from './colors';
	import Tag from '../tag/tag.svelte';

	const timeline = timelineContext.get();
	const board = boardContext.get();

	type Props = {
		type: CategoryType;
		category: Category;
		draggedCategory: DraggedCategory;
		handleModalOpen: (type: CategoryType, categoryId?: number) => void;
	};

	let { type, category, handleModalOpen, draggedCategory = $bindable() }: Props = $props();

	function handleDragStart(e: DragEvent) {
		e.dataTransfer?.setData('text/plain', 'dragged');

		draggedCategory.id = category.id;
		draggedCategory.offset = {
			x: e.offsetX,
			y: e.offsetY
		};
		draggedCategory.container = {
			width: (e.currentTarget as HTMLElement).clientWidth,
			height: (e.currentTarget as HTMLElement).clientHeight
		};
	}

	function addEvent(button: Button): Promise<void> {
		return timeline.addEvent(button.id, category.id, timeline.currentTime);
	}

	function removeCategory() {
		board.deleteCategory(type, category.id);
	}

	function editCategory() {
		handleModalOpen(type, category.id);
	}
</script>

<!-- Draggable element absolutely positioned by percentage -->
<div
	class="absolute z-10 inline-block min-h-10 cursor-move rounded border border-gray-900 bg-gray-700 px-1 pb-1 text-blue-950 shadow select-none"
	style="
	left: {category.position.x}%;
	top: {category.position.y}%;"
	draggable="true"
	ondragstart={(e) => handleDragStart(e)}
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
		<div class="ml-2 flex w-5 items-center justify-end gap-1">
			{#if board.isEditing}
				<button class="hover:cursor-pointer" onclick={() => removeCategory()}>
					<IconTrash class="h-3 w-3 text-gray-400 hover:text-white" />
				</button>
				<button class="hover:cursor-pointer" onclick={() => editCategory()}>
					<IconPencil class="h-3 w-3 text-gray-400 hover:text-white" />
				</button>
			{/if}
		</div>
	</div>
	<div class="flex flex-wrap gap-2">
		{#if type === CategoryType.Event}
			{#each category.buttons as button, idx (button.id ?? `temp-${category.id}-${idx}`)}
				<button
					style={`
					background-color: ${button.color};
					color: ${getTextColorForBackground(button.color)};
				`}
					class="rounded-xs border border-gray-800 px-2
				py-1
				text-xs shadow-sm
				hover:cursor-pointer
				hover:brightness-120"
					onclick={() => addEvent(button as Button)}
				>
					{button.name}
				</button>
			{/each}
		{/if}
		{#if type === CategoryType.Tag}
			{#each category.buttons as tag, idx (tag.id ?? `temp-${category.id}-${idx}`)}
				<Tag
					color={tag.color}
					text={tag.name}
					onClick={() => timeline.addRelatedTagToEvent(tag.id!)}
				/>
			{/each}
		{/if}
	</div>
</div>
