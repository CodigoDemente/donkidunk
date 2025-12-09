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
		handleModalOpen: (type: CategoryType, categoryId?: string) => void;
	};

	let { type, category, handleModalOpen, draggedCategory = $bindable() }: Props = $props();

	let categoryElement: HTMLDivElement;
	let headerElement: HTMLDivElement;
	let contentElement: HTMLDivElement;
	let resizeHandle: string | null = $state(null);
	let resizeStartX = 0;
	let resizeStartY = 0;
	let resizeStartWidth = 0;
	let resizeStartHeight = 0;
	let resizeStartLeft = 0;
	let resizeStartTop = 0;
	let containerElement: HTMLElement | null = null;
	let cachedMinHeight = 0;

	function handleDragStart(e: DragEvent) {
		// Prevent drag if clicking on a resize handle or if resize is active
		const target = e.target as HTMLElement;
		if (target.hasAttribute('data-resize-handle') || resizeHandle) {
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
		e.preventDefault();
		e.stopPropagation();
		e.stopImmediatePropagation();

		resizeHandle = handle;

		if (!categoryElement || !categoryElement.parentElement) return;

		containerElement = categoryElement.parentElement;
		const rect = categoryElement.getBoundingClientRect();
		const containerRect = containerElement.getBoundingClientRect();

		resizeStartX = e.clientX;
		resizeStartY = e.clientY;
		resizeStartWidth = rect.width;
		// Use actual rendered height in pixels
		resizeStartHeight = rect.height;
		resizeStartLeft = ((rect.left - containerRect.left) / containerRect.width) * 100;
		resizeStartTop = ((rect.top - containerRect.top) / containerRect.height) * 100;

		// Initialize size if it doesn't exist, converting current dimensions to percentages
		// Update through board context to avoid mutating props
		if (!category.size) {
			const currentWidthPercent = (rect.width / containerRect.width) * 100;
			const currentHeightPercent = (rect.height / containerRect.height) * 100;
			board.updateCategorySize(type, category.id, currentWidthPercent, currentHeightPercent);
		}

		// Cache minimum content height at the start of resize
		// Calculate based on actual content height
		if (headerElement && contentElement) {
			const headerHeight = headerElement.offsetHeight;
			const contentHeight = contentElement.scrollHeight;
			const minHeightPx = headerHeight + contentHeight;
			cachedMinHeight = (minHeightPx / containerRect.height) * 100;
		} else {
			cachedMinHeight = 5; // Fallback minimum
		}
	}

	function handleResizeMove(e: MouseEvent) {
		if (!resizeHandle || !categoryElement || !containerElement) return;

		const containerRect = containerElement.getBoundingClientRect();
		const deltaX = ((e.clientX - resizeStartX) / containerRect.width) * 100;
		const deltaY = ((e.clientY - resizeStartY) / containerRect.height) * 100;

		const startWidthPercent = (resizeStartWidth / containerRect.width) * 100;
		const startHeightPercent = (resizeStartHeight / containerRect.height) * 100;

		let newWidth = startWidthPercent;
		let newHeight = startHeightPercent;
		let newLeft = resizeStartLeft;
		let newTop = resizeStartTop;

		// Handle different resize directions
		if (resizeHandle.includes('right')) {
			newWidth = startWidthPercent + deltaX;
		}
		if (resizeHandle.includes('left')) {
			newWidth = startWidthPercent - deltaX;
			newLeft = resizeStartLeft + deltaX;
		}
		if (resizeHandle.includes('bottom')) {
			newHeight = startHeightPercent + deltaY;
		}
		if (resizeHandle.includes('top')) {
			newHeight = startHeightPercent - deltaY;
			newTop = resizeStartTop + deltaY;
		}

		// Apply minimum height constraint based on content (use cached value)
		// Width is handled by Tailwind min-w-fit, so we don't constrain it here
		if (cachedMinHeight > 0 && newHeight < cachedMinHeight) {
			if (resizeHandle.includes('top')) {
				newTop = resizeStartTop + startHeightPercent - cachedMinHeight;
			}
			newHeight = cachedMinHeight;
		}

		// Prevent overflow
		if (newLeft < 0) {
			newWidth += newLeft;
			newLeft = 0;
		}
		if (newTop < 0) {
			newHeight += newTop;
			newTop = 0;
		}
		if (newLeft + newWidth > 100) {
			newWidth = 100 - newLeft;
		}
		if (newTop + newHeight > 100) {
			newHeight = 100 - newTop;
		}

		// Update position and size through board context (avoids mutating props)
		board.updateCategoryPosition(type, category.id, newLeft, newTop);
		board.updateCategorySize(type, category.id, newWidth, newHeight);
	}

	function handleResizeEnd() {
		// Position and size are already updated during resize
		// The board context methods handle persistence
		resizeHandle = null;
	}

	$effect(() => {
		if (resizeHandle) {
			const handleMove = (e: MouseEvent) => handleResizeMove(e);
			const handleEnd = () => {
				handleResizeEnd();
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
	class="absolute z-10 inline-block min-h-10 min-w-fit rounded border border-gray-900 bg-gray-700 text-blue-950 shadow select-none"
	class:cursor-move={!resizeHandle}
	class:w-fit={!category.size?.width}
	style="
	left: {category.position.x}%;
	top: {category.position.y}%;
	width: {category.size?.width ? category.size.width + '%' : undefined};
	height: {category.size?.height ? category.size.height + '%' : 'auto'};"
	draggable={!resizeHandle}
	ondragstart={(e) => handleDragStart(e)}
	role="button"
	aria-grabbed="true"
	tabindex="0"
>
	<div
		bind:this={headerElement}
		class="flex items-center justify-between gap-2 border-b border-gray-800 px-2 py-1"
	>
		<p class="flex items-center gap-1 text-sm font-semibold text-gray-200">
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
	<div bind:this={contentElement} class="flex flex-wrap gap-2 p-2">
		{#if type === CategoryType.Event}
			{#each category.buttons as button, idx (button.id ?? `temp-${category.id}-${idx}`)}
				<button
					style={`
					background-color: ${button.color};
					color: ${getTextColorForBackground(button.color)};
				`}
					class="rounded-xs border border-gray-800 px-2
				py-1
				text-sm shadow-sm
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

	<!-- Resize handles -->
	<!-- Border handles -->
	<div
		class="absolute top-0 left-0 h-full w-2 cursor-ew-resize transition-colors hover:bg-blue-500/50"
		style="z-index: 20; pointer-events: auto;"
		data-resize-handle
		onmousedown={(e) => handleResizeStart(e, 'left')}
		ondragstart={(e) => e.preventDefault()}
		role="button"
		aria-label="Resize left"
		tabindex="0"
	></div>
	<div
		class="absolute top-0 right-0 h-full w-2 cursor-ew-resize transition-colors hover:bg-blue-500/50"
		style="z-index: 20; pointer-events: auto;"
		data-resize-handle
		onmousedown={(e) => handleResizeStart(e, 'right')}
		ondragstart={(e) => e.preventDefault()}
		role="button"
		aria-label="Resize right"
		tabindex="0"
	></div>
	<div
		class="absolute top-0 left-0 h-2 w-full cursor-ns-resize transition-colors hover:bg-blue-500/50"
		style="z-index: 20; pointer-events: auto;"
		data-resize-handle
		onmousedown={(e) => handleResizeStart(e, 'top')}
		ondragstart={(e) => e.preventDefault()}
		role="button"
		aria-label="Resize top"
		tabindex="0"
	></div>
	<div
		class="absolute bottom-0 left-0 h-2 w-full cursor-ns-resize transition-colors hover:bg-blue-500/50"
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
		class="absolute top-0 left-0 h-4 w-4 cursor-nwse-resize transition-colors hover:bg-blue-500/50"
		style="z-index: 21; pointer-events: auto;"
		data-resize-handle
		onmousedown={(e) => handleResizeStart(e, 'top-left')}
		ondragstart={(e) => e.preventDefault()}
		role="button"
		aria-label="Resize top-left"
		tabindex="0"
	></div>
	<div
		class="absolute top-0 right-0 h-4 w-4 cursor-nesw-resize transition-colors hover:bg-blue-500/50"
		style="z-index: 21; pointer-events: auto;"
		data-resize-handle
		onmousedown={(e) => handleResizeStart(e, 'top-right')}
		ondragstart={(e) => e.preventDefault()}
		role="button"
		aria-label="Resize top-right"
		tabindex="0"
	></div>
	<div
		class="absolute bottom-0 left-0 h-4 w-4 cursor-nesw-resize transition-colors hover:bg-blue-500/50"
		style="z-index: 21; pointer-events: auto;"
		data-resize-handle
		onmousedown={(e) => handleResizeStart(e, 'bottom-left')}
		ondragstart={(e) => e.preventDefault()}
		role="button"
		aria-label="Resize bottom-left"
		tabindex="0"
	></div>
	<div
		class="absolute right-0 bottom-0 h-4 w-4 cursor-nwse-resize transition-colors hover:bg-blue-500/50"
		style="z-index: 21; pointer-events: auto;"
		data-resize-handle
		onmousedown={(e) => handleResizeStart(e, 'bottom-right')}
		ondragstart={(e) => e.preventDefault()}
		role="button"
		aria-label="Resize bottom-right"
		tabindex="0"
	></div>
</div>
