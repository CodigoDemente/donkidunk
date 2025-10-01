<script lang="ts">
	import { projectActions } from '../../persistence/stores/project/actions';
	import addCategoryModal from '../../modules/modalContent/addCategoryModal/index.svelte';
	import { IconPlus, IconChevronDown } from '@tabler/icons-svelte';
	import Button from '../button/button.svelte';
	import type { Props } from './types';
	import { boardContext } from '../../modules/board/context.svelte';
	import Category from './category.svelte';
	import { timelineContext } from '../../modules/videoplayer/context.svelte';

	const context = boardContext.get();

	let isResizing = false;
	let frame: number | null = null;

	let { boxHeight, isOpened, otherIsOpened, title, type, categories }: Props = $props();

	let draggedCategoryId: number = $state(-1);

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

	function handleDrop(e: DragEvent) {
		const container = e.currentTarget as HTMLElement;

		const rect = container.getBoundingClientRect();
		let x = ((e.clientX - rect.left) / rect.width) * 100;
		let y = ((e.clientY - rect.top) / rect.height) * 100;

		// Limitar para que no sobresalga
		x = Math.max(0, Math.min(x, 100 - boxWidthPercent));
		y = Math.max(0, Math.min(y, 100 - boxHeightPercent));

		context.updateCategoryPosition(type, draggedCategoryId, x, y);
	}

	function allowDrop(e: DragEvent) {
		e.preventDefault();
	}

	function handleModalOpen(categoryId?: number) {
		projectActions.setModal({
			content: addCategoryModal,
			props: { type, categoryId },
			title: `Add category to ${title}`,
			onCancel: () => context.resetCategoryForm(),
			onSubmit: () => context.addOrUpdateCategory(type),
			show: true,
			size: 'medium'
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
			class="ml-2 rounded p-1 transition hover:text-gray-200"
			onclick={() => (isOpened = !isOpened)}
			aria-label={isOpened ? 'Fold Events' : 'Unfold Events'}
		>
			<span class="inline-block transition-transform duration-200" class:rotate-180={isOpened}>
				<IconChevronDown />
			</span>
		</button>
	</div>

	{#if isOpened}
		<Button
			customClass="absolute right-5 top-14 z-10"
			size="mini"
			primary
			onClick={handleModalOpen}
		>
			<IconPlus class="text-white" />
		</Button>
		<div
			class="relative min-h-0 min-w-0 flex-1 overflow-hidden"
			ondrop={(e) => handleDrop(e)}
			ondragover={allowDrop}
			id={`drop-area-categories-${type}`}
			role="region"
			aria-label="Drop area"
		>
			{#each categories as category (category.id)}
				<Category {type} {category} bind:draggedCategoryId />
			{/each}
		</div>
	{/if}
</div>

<div class="h-1"></div>

{#if isOpened}
	<button
		type="button"
		class="h-1 w-full flex-shrink-0 cursor-row-resize bg-gray-900"
		onmousedown={startResize}
		style="z-index: 20;"
		aria-label="Resize section"
		tabindex="0"
	></button>
{/if}
