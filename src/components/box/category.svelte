<script lang="ts">
	import type { Category } from '../../modules/board/types/Category';
	import { timelineContext } from '../../modules/videoplayer/context.svelte';
	import { boardContext } from '../../modules/board/context.svelte';
	import { CategoryType, type DraggedCategory } from './types';
	import type { Button } from '../../modules/board/types/Button';
	import { IconPencil, IconTrash } from '@tabler/icons-svelte';
	import { getTextColorForBackground } from './colors';
	import Tag from '../tag/tag.svelte';
	import {
		createResizeState,
		handleResizeStart as resizeStart,
		handleResizeMove as resizeMove,
		handleResizeEnd as resizeEnd,
		type ResizeState
	} from './utils';

	const timeline = timelineContext.get();
	const board = boardContext.get();

	type Props = {
		type: CategoryType;
		category: Category;
		draggedCategory: DraggedCategory;
		handleModalOpen: (type: CategoryType, categoryId?: string) => void;
	};

	let { type, category, handleModalOpen, draggedCategory = $bindable() }: Props = $props();

	let categoryElement: HTMLDivElement;
	let headerElement: HTMLDivElement;
	let contentElement: HTMLDivElement;
	let resizeState: ResizeState = $state(createResizeState());

	function handleDragStart(e: DragEvent) {
		// Prevent drag if clicking on a resize handle or if resize is active
		const target = e.target as HTMLElement;
		if (target.hasAttribute('data-resize-handle') || resizeState.resizeHandle) {
			e.preventDefault();
			e.stopPropagation();
			return false;
		}

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

	function handleResizeStart(e: MouseEvent, handle: string) {
		resizeStart(
			e,
			handle,
			resizeState,
			categoryElement,
			headerElement,
			contentElement,
			category,
			type,
			board
		);
	}

	$effect(() => {
		if (resizeState.resizeHandle) {
			const handleMove = (e: MouseEvent) =>
				resizeMove(e, resizeState, categoryElement, category, type, board);
			const handleEnd = () => {
				resizeEnd(resizeState);
				document.removeEventListener('mousemove', handleMove);
				document.removeEventListener('mouseup', handleEnd);
			};

			document.addEventListener('mousemove', handleMove);
			document.addEventListener('mouseup', handleEnd);
		}
	});

	function addEvent(button: Button): Promise<void> {
		return timeline.addEvent(
			button.id,
			category.id,
			timeline.currentTime,
			button.duration ?? undefined,
			button.before ?? undefined
		);
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
	bind:this={categoryElement}
	class="absolute z-10 inline-flex min-h-10 flex-col rounded border border-gray-900 bg-gray-700 text-blue-950 shadow select-none"
	class:cursor-move={!resizeState.resizeHandle}
	class:min-w-fit={!category.size?.width}
	class:w-fit={!category.size?.width}
	style="
	left: {category.position.x}%;
	top: {category.position.y}%;
	width: {category.size?.width ? category.size.width + 'px' : undefined};
	height: {category.size?.height ? category.size.height + 'px' : 'auto'};
	min-height: min-content;
	min-width: min-content"
	draggable={!resizeState.resizeHandle}
	ondragstart={(e) => handleDragStart(e)}
	role="button"
	aria-grabbed="true"
	tabindex="0"
>
	<div
		bind:this={headerElement}
		class="flex items-start justify-between gap-2 border-b border-gray-800 px-2 py-1 pb-0"
	>
		<p class="flex items-start gap-1 text-xs font-semibold text-gray-200">
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
	<div bind:this={contentElement} class="flex w-full flex-wrap items-start gap-2 p-2">
		{#if type === CategoryType.Event}
			{#each category.buttons as button, idx (button.id ?? `temp-${category.id}-${idx}`)}
				<button
					style={`
					background-color: ${button.color};
					color: ${getTextColorForBackground(button.color)};
				`}
					class="shrink-0 rounded-xs border border-gray-800 px-2 py-1 text-sm shadow-sm hover:cursor-pointer hover:brightness-120"
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

	<!-- Resize handles -->
	<!-- Border handles -->
	<div
		class="absolute top-0 left-0 h-full w-1 cursor-ew-resize transition-colors hover:bg-blue-500/50"
		style="z-index: 20; pointer-events: auto;"
		data-resize-handle
		onmousedown={(e) => handleResizeStart(e, 'left')}
		ondragstart={(e) => e.preventDefault()}
		role="button"
		aria-label="Resize left"
		tabindex="0"
	></div>
	<div
		class="absolute top-0 right-0 h-full w-1 cursor-ew-resize transition-colors hover:bg-blue-500/50"
		style="z-index: 20; pointer-events: auto;"
		data-resize-handle
		onmousedown={(e) => handleResizeStart(e, 'right')}
		ondragstart={(e) => e.preventDefault()}
		role="button"
		aria-label="Resize right"
		tabindex="0"
	></div>
	<div
		class="absolute top-0 left-0 h-1 w-full cursor-ns-resize transition-colors hover:bg-blue-500/50"
		style="z-index: 20; pointer-events: auto;"
		data-resize-handle
		onmousedown={(e) => handleResizeStart(e, 'top')}
		ondragstart={(e) => e.preventDefault()}
		role="button"
		aria-label="Resize top"
		tabindex="0"
	></div>
	<div
		class="absolute bottom-0 left-0 h-1 w-full cursor-ns-resize transition-colors hover:bg-blue-500/50"
		style="z-index: 20; pointer-events: auto;"
		data-resize-handle
		onmousedown={(e) => handleResizeStart(e, 'bottom')}
		ondragstart={(e) => e.preventDefault()}
		role="button"
		aria-label="Resize bottom"
		tabindex="0"
	></div>

	<!-- Corner handles -->
	<div
		class="absolute top-0 left-0 h-2 w-2 cursor-nwse-resize transition-colors hover:bg-blue-500/50"
		style="z-index: 21; pointer-events: auto;"
		data-resize-handle
		onmousedown={(e) => handleResizeStart(e, 'top-left')}
		ondragstart={(e) => e.preventDefault()}
		role="button"
		aria-label="Resize top-left"
		tabindex="0"
	></div>
	<div
		class="absolute top-0 right-0 h-2 w-2 cursor-nesw-resize transition-colors hover:bg-blue-500/50"
		style="z-index: 21; pointer-events: auto;"
		data-resize-handle
		onmousedown={(e) => handleResizeStart(e, 'top-right')}
		ondragstart={(e) => e.preventDefault()}
		role="button"
		aria-label="Resize top-right"
		tabindex="0"
	></div>
	<div
		class="absolute bottom-0 left-0 h-2 w-2 cursor-nesw-resize transition-colors hover:bg-blue-500/50"
		style="z-index: 21; pointer-events: auto;"
		data-resize-handle
		onmousedown={(e) => handleResizeStart(e, 'bottom-left')}
		ondragstart={(e) => e.preventDefault()}
		role="button"
		aria-label="Resize bottom-left"
		tabindex="0"
	></div>
	<div
		class="absolute right-0 bottom-0 h-2 w-2 cursor-nwse-resize transition-colors hover:bg-blue-500/50"
		style="z-index: 21; pointer-events: auto;"
		data-resize-handle
		onmousedown={(e) => handleResizeStart(e, 'bottom-right')}
		ondragstart={(e) => e.preventDefault()}
		role="button"
		aria-label="Resize bottom-right"
		tabindex="0"
	></div>
</div>
