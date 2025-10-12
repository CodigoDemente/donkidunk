<script lang="ts">
	import { projectActions } from '../../persistence/stores/project/actions';
	import addCategoryModal from '../../modules/modalContent/addCategoryModal/index.svelte';
	import addTagsModal from '../../modules/modalContent/addTagsModal.svelte';
	import { IconPlus, IconChevronDown } from '@tabler/icons-svelte';
	import Button from '../button/button.svelte';
	import { CategoryType, type Props } from './types';
	import { boardContext } from '../../modules/board/context.svelte';
	import { getTextColorForBackground } from './colors';
	import { startResize } from './utils';
	import Category from './category.svelte';
	import { timelineContext } from '../../modules/videoplayer/context.svelte';

	const board = boardContext.get();
	const timeline = timelineContext.get();

	let { boxHeight, isOpened, otherIsOpened, title, type, categories, tags }: Props = $props();

	let draggedCategoryId: number = $state(-1);

	const boxWidthPercent = 15; // ancho del draggable en %
	const boxHeightPercent = 15; // alto del draggable en %

	function setBoxHeight(newHeight: number) {
		boxHeight = newHeight;
	}

	function handleDrop(e: DragEvent) {
		const container = e.currentTarget as HTMLElement;

		const rect = container.getBoundingClientRect();
		let x = ((e.clientX - rect.left) / rect.width) * 100;
		let y = ((e.clientY - rect.top) / rect.height) * 100;

		// Limitar para que no sobresalga
		x = Math.max(0, Math.min(x, 100 - boxWidthPercent));
		y = Math.max(0, Math.min(y, 100 - boxHeightPercent));

		board.updateCategoryPosition(type, draggedCategoryId, x, y);
	}

	function allowDrop(e: DragEvent) {
		e.preventDefault();
	}

	function handleModalOpen(type: CategoryType | 'tag', categoryId?: number) {
		const tagCreation = type === 'tag';
		if (type === CategoryType.Event || type === CategoryType.Action) {
			board.loadCategoryToAddOrEdit(type, categoryId);
		}
		projectActions.setModal({
			content: tagCreation ? addTagsModal : addCategoryModal,
			title: tagCreation ? `Create tags` : `Add category to ${title}`,
			onCancel: () => (tagCreation ? board.resetTagsListForm() : board.resetCategoryForm(type)),
			onSubmit: () => (tagCreation ? board.addTagsList() : board.addOrUpdateCategory(type)),
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
			onClick={() => handleModalOpen(type)}
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
		{#if type === CategoryType.Event}
			<div
				class="absolute bottom-2 mx-1 mt-4 flex max-h-1/2 w-[calc(100%-0.5rem)] flex-col self-end rounded-sm border border-gray-500 bg-gray-700 shadow-inner transition-all duration-200"
			>
				<div
					class="flex h-8 items-center justify-between border-b border-gray-500 bg-gray-700 px-4"
				>
					<p class="text-xs font-semibold text-white">Tags</p>
					<Button
						customClass="!h-5 !w-5 p-0 flex items-center justify-center"
						size="mini"
						primary
						onClick={() => handleModalOpen('tag')}
					>
						<IconPlus class="h-4 w-4 text-white" />
					</Button>
				</div>
				{#if !tags || tags.length === 0}
					<p class=" p-6 text-center text-gray-400">
						No tags yet. Click in the <span class="text-primary font-semibold">+ button</span> to create
						your first tag.
					</p>
				{:else}
					<div class="flex flex-wrap gap-2 overflow-y-auto p-3">
						{#each tags as tag, idx (tag.id ?? idx)}
							<div
								class="rounded-xs px-3 py-1 text-xs font-medium"
								style="background-color: {tag.color}; color: {getTextColorForBackground(tag.color)}"
								onclick={() => timeline.addRelatedTagToEvent(tag.id!)}
							>
								{tag.name}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	{/if}
</div>

<div class="h-1"></div>

<!-- Resize bar -->
{#if isOpened}
	<button
		type="button"
		class="h-1 w-full flex-shrink-0 cursor-row-resize bg-gray-900"
		onmousedown={() => startResize(setBoxHeight)}
		style="z-index: 20;"
		aria-label="Resize section"
		tabindex="0"
	></button>
{/if}
