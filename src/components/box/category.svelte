<script lang="ts">
	import { slide } from 'svelte/transition';
	import { boardContext } from '../../modules/board/context.svelte';
	import type { Category } from '../../modules/board/types/Category';
	import { getTextColorForBackground } from './colors';

	let showAddButton = $state(false);

	let newButton = $state({
		name: ''
	});

	let newButtonError = $state('');

	type Props = {
		type: 'eventCategories' | 'actionCategories';
		category: Category;
		draggedCategoryId: number | null;
	};

	const context = boardContext.get();

	let { type, category, draggedCategoryId = $bindable() }: Props = $props();

	function handleDragStart(e: DragEvent, categoryId: number) {
		e.dataTransfer?.setData('text/plain', 'dragged');
		draggedCategoryId = categoryId;
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
	<div class="absolute top-10 right-0 z-10 bg-gray-700" class:p-2={showAddButton}>
		<button
			class="h-10 w-10 cursor-pointer text-white hover:bg-gray-600 active:bg-gray-500"
			onclick={() => (showAddButton = !showAddButton)}
		>
			<div class="transition-rotate duration-300 ease-in" class:rotate-45={showAddButton}>+</div>
		</button>
		{#if showAddButton}
			<div
				class="mt-2 flex flex-col items-start gap-2"
				in:slide={{ duration: 300 }}
				out:slide|local={{ duration: 300 }}
			>
				<div class="flex flex-row gap-1">
					<input
						type="text"
						placeholder="Category Name"
						bind:value={newButton.name}
						onchange={() => (newButtonError = '')}
						class="h-8 w-full rounded bg-gray-800 p-1 text-white"
					/>
				</div>

				{#if newButtonError}
					<div class="mt-1 text-red-500">
						<p>{newButtonError}</p>
					</div>
				{/if}

				<button
					class="h-8 w-10 cursor-pointer rounded bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-400"
					onclick={async () => {
						newButtonError = !newButton.name ? 'Button name is required' : '';

						if (newButtonError) {
							return;
						}

						await context.addButtonToCategory(type, category.id, newButton.name);
						newButton.name = '';
						showAddButton = false;
					}}
				>
					Add
				</button>
			</div>
		{/if}
	</div>
	<div>{category.name}</div>
	<div class="mt-2 flex flex-wrap gap-2">
		{#each category.buttons as button (button.id)}
			<button class="rounded bg-gray-600 px-2 py-1 text-xs text-white hover:bg-gray-500">
				{button.name}
			</button>
		{/each}
	</div>
</div>
