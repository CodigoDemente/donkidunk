<script lang="ts">
	import { boardContext } from '../../modules/board/context.svelte';
	import type { Category } from '../../modules/board/types/Category';
	import { projectActions } from '../../persistence/stores/project/actions';
	import { getTextColorForBackground } from './colors';
	import Form from './form.svelte';

	let isResizing = false;
	let frame: number | null = null;
	let showAddCategory = $state(false);

	type Props = {
		boxHeight: number;
		isOpened: boolean;
		otherIsOpened: boolean;
		title: string;
		type: 'eventCategories' | 'actionCategories';
		categories: Category[];
		addCategory: (name: string, color: string) => Promise<void>;
	};

	let { boxHeight, isOpened, otherIsOpened, title, type, categories, addCategory }: Props =
		$props();

	const context = boardContext.get();

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

	function startResize() {
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

		context.updateCategoryPosition(type, categoryId, x, y);
	}

	function handleDragStart(e: DragEvent) {
		e.dataTransfer?.setData('text/plain', 'dragged');
	}
	function allowDrop(e: DragEvent) {
		e.preventDefault();
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
			onclick={() => (isOpened = !isOpened)}
			aria-label={isOpened ? 'Fold Events' : 'Unfold Events'}
		>
			<span class="inline-block transition-transform duration-200" class:rotate-180={isOpened}>
				▼
			</span>
		</button>
	</div>

	{#if isOpened && projectActions.getDatabase()}
		<div class="absolute top-10 right-0 z-10 bg-gray-700" class:p-2={showAddCategory}>
			<button
				class="h-10 w-10 cursor-pointer text-white hover:bg-gray-600 active:bg-gray-500"
				onclick={() => (showAddCategory = !showAddCategory)}
			>
				<div class="transition-rotate duration-300 ease-in" class:rotate-45={showAddCategory}>
					+
				</div>
			</button>
			{#if showAddCategory}
				<Form {addCategory} onclose={() => (showAddCategory = false)} />
			{/if}
		</div>
		{#each categories as category (category.id)}
			<div
				class="relative min-h-0 min-w-0 flex-1 overflow-hidden"
				ondrop={(e) => handleDrop(e, category.id)}
				ondragover={allowDrop}
				id={`drop-area-${category.id}`}
				role="region"
				aria-label="Drop area"
			>
				<!-- Draggable element absolutely positioned by percentage -->
				<div
					class="absolute z-10 h-10 cursor-move rounded p-2 shadow select-none"
					style="
					background-color: {category.color};
					color: {getTextColorForBackground(category.color)};
					left: {category.position.x}%;
					top: {category.position.y}%;"
					draggable="true"
					ondragstart={handleDragStart}
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
	<button
		class="h-1 w-full flex-shrink-0 cursor-row-resize bg-gray-900"
		aria-label="resize"
		onmousedown={startResize}
		style="z-index: 20;"
	></button>
{/if}

<style>
	.rotate-180 {
		transform: rotate(180deg);
	}
</style>
