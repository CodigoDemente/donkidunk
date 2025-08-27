<script lang="ts">
	import type { Category } from '../../persistence/stores/board/types/Category';
	import { boardActions } from '../../persistence/stores/board/actions';
	import { projectActions } from '../../persistence/stores/project/actions';
	import AddButtonsModal from '../../modules/modalContent/addButtonsModal.svelte';

	let isResizing = false;
	let frame: number | null = null;

	export let boxHeight: number;
	export let isOpened: boolean;
	export let otherIsOpened: boolean;
	export let title: string;
	export let type: 'eventCategories' | 'actionCategories';
	export let categories: Category[];

	function resize(e: MouseEvent) {
		if (!isResizing) return;
		if (frame) cancelAnimationFrame(frame);
		frame = requestAnimationFrame(() => {
			const container = document.getElementById('boards-container');
			if (!container) return;
			const rect = container.getBoundingClientRect();
			const y = e.clientY - rect.top;
			const percent = Math.max(10, Math.min(90, (y / rect.height) * 100));
			boxHeight = percent;
		});
	}

	function startResize(e: MouseEvent) {
		isResizing = true;
		document.body.style.cursor = 'row-resize';
		window.addEventListener('mousemove', resize);
		window.addEventListener('mouseup', stopResize);
		window.addEventListener('mouseleave', stopResize);
	}
	function stopResize() {
		isResizing = false;
		document.body.style.cursor = '';
		window.removeEventListener('mousemove', resize);
		window.removeEventListener('mouseup', stopResize);
		window.removeEventListener('mouseleave', stopResize);
	}

	const boxWidthPercent = 15; // ancho del draggable en %
	const boxHeightPercent = 15; // alto del draggable en %

	function handleDrop(e: DragEvent, categoryId: number) {
		const container = e.currentTarget as HTMLElement;

		const rect = container.getBoundingClientRect();
		let x = ((e.clientX - rect.left) / rect.width) * 100;
		let y = ((e.clientY - rect.top) / rect.height) * 100;

		// Limitar para que no sobresalga
		x = Math.max(0, Math.min(x, 100 - boxWidthPercent));
		y = Math.max(0, Math.min(y, 100 - boxHeightPercent));

		boardActions.updateCategoryPosition(type, categoryId, x, y);
	}

	function handleDragStart(e: DragEvent) {
		e.dataTransfer?.setData('text/plain', 'dragged');
	}
	function allowDrop(e: DragEvent) {
		e.preventDefault();
	}

	function handleModalOpen() {
		projectActions.setModal({
			content: AddButtonsModal,
			title: `Add category to ${title}`,
			onCancel: () => console.log('Modal cancelled'),
			onSubmit: () => console.log('Modal submitted'),
			show: true
		});
	}
</script>

<div
	class={`relative flex flex-col rounded-lg border border-gray-600 bg-gray-800 transition-all duration-200
    ${!isOpened ? 'h-10 min-h-0 flex-shrink-0' : otherIsOpened ? '' : 'min-h-[40px] flex-1'}`}
	style={isOpened && otherIsOpened ? `height: ${boxHeight}%; min-height: 40px;` : ''}
>
	<div class="flex h-10 items-center justify-between border-b border-gray-600 bg-gray-800 px-4">
		<p class="text-xs font-semibold text-white">{title}</p>
		<button
			class="ml-2 rounded p-1 transition hover:bg-gray-700"
			on:click={() => (isOpened = !isOpened)}
			aria-label={isOpened ? 'Fold Events' : 'Unfold Events'}
		>
			<span class="inline-block transition-transform duration-200" class:rotate-180={isOpened}>
				▼
			</span>
		</button>
	</div>

	{#if isOpened}
		<button on:click={handleModalOpen}>ADD</button>
		{#each categories as category (category.id)}
			<div
				class="relative min-h-0 min-w-0 flex-1 overflow-hidden"
				on:drop={(e) => handleDrop(e, category.id)}
				on:dragover={allowDrop}
				id={`drop-area-${category.id}`}
				role="region"
				aria-label="Drop area"
			>
				<!-- Draggable element absolutely positioned by percentage -->
				<div
					class="absolute z-10 h-10 w-10 cursor-move rounded bg-orange-400 shadow select-none"
					style="
					color: {category.color};
					left: {category.position.x}%;
					top: {category.position.y}%;"
					draggable="true"
					on:dragstart={handleDragStart}
					role="button"
					aria-grabbed="true"
					tabindex="0"
				>
					{category.name}
				</div>
			</div>
		{/each}
	{/if}
</div>

<!-- Add updateCategoryName, addButtonToCategory, timelineactions.addEvent -->
<!-- <input type="color" bind:value={category.color} class="mt-2" /> -->

<div class="h-1"></div>

{#if isOpened}
	<div
		class="h-1 w-full flex-shrink-0 cursor-row-resize bg-gray-900"
		on:mousedown={startResize}
		style="z-index: 20;"
	></div>
{/if}
