<script lang="ts">
	import { projectActions } from '../../persistence/stores/project/actions';
	import addCategoryModal from '../../modules/modalContent/addCategoryModal/index.svelte';
	import { IconPlus, IconChevronDown } from '@tabler/icons-svelte';
	import Button from '../button/button.svelte';
	import { CategoryType, type DraggedCategory, type Props } from './types';
	import { boardContext } from '../../modules/board/context.svelte';
	import Category from './category.svelte';
	import { v7 as uuidv7 } from 'uuid';

	const board = boardContext.get();

	let { boxHeight, isOpened, otherIsOpened, title, type, categories }: Props = $props();

	let draggedCategory: DraggedCategory = $state({
		id: uuidv7(),
		offset: {
			x: 0,
			y: 0
		},
		container: {
			width: 0,
			height: 0
		}
	});

	function setBoxHeight(newHeight: number) {
		boxHeight = newHeight;
	}

	function handleDrop(e: DragEvent) {
		const container = e.currentTarget as HTMLElement;

		const rect = container.getBoundingClientRect();
		let x = ((e.clientX - draggedCategory.offset.x - rect.left) / rect.width) * 100;
		let y = ((e.clientY - draggedCategory.offset.y - rect.top) / rect.height) * 100;

		const draggedWidthPercent = (draggedCategory.container.width / rect.width) * 100;
		const draggedHeightPercent = (draggedCategory.container.height / rect.height) * 100;

		// Limit to prevent overflow
		x = Math.max(0, Math.min(x, 100 - draggedWidthPercent));
		y = Math.max(0, Math.min(y, 100 - draggedHeightPercent));

		board.updateCategoryPosition(type, draggedCategory.id, x, y);
	}

	function allowDrop(e: DragEvent) {
		e.preventDefault();
	}

	function handleModalOpen(type: CategoryType, categoryId?: string) {
		board.loadCategoryToAddOrEdit(type, categoryId);
		projectActions.setModal({
			content: addCategoryModal,
			title: `Add category to ${title}`,
			onCancel: () => board.resetCategoryForm(type),
			onSubmit: () => board.addOrUpdateCategory(type),
			show: true,
			size: 'large'
		});
	}
</script>

<div
	data-box
	class={`relative flex flex-col rounded-lg border border-gray-600 bg-gray-800 transition-all duration-200
    ${!isOpened ? 'h-10 min-h-0 shrink-0' : otherIsOpened ? '' : 'min-h-[40px] flex-1'}`}
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
			class="relative min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto"
			ondrop={(e) => handleDrop(e)}
			ondragover={allowDrop}
			id={`drop-area-categories-${type}`}
			role="region"
			aria-label="Drop area"
		>
			{#each categories as category (category.id)}
				<Category {type} {category} {handleModalOpen} bind:draggedCategory />
			{/each}
		</div>
	{/if}
</div>
