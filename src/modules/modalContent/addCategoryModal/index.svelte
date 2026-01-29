<script lang="ts">
	import { CategoryType } from '../../../components/box/types';
	import Dropdown from '../../../components/dropdown/dropdown.svelte';
	import Input from '../../../components/input/input.svelte';
	import Button from '../../../components/button/button.svelte';
	import { boardContext } from '../../board/context.svelte';
	import { timelineContext } from '../../videoplayer/context.svelte';
	import { projectActions } from '../../../persistence/stores/project/actions';
	import ButtonsTable from './buttonsTable.svelte';

	const context = boardContext.get();
	const timeline = timelineContext.get();

	const categoryType = context.categoryToCreate.type;
	const categoryIsAlreadyCreated = context.categoryToCreate.buttons.length > 0;

	let selectedCategoryId = $state<string | null>(categoryIsAlreadyCreated ? null : 'NEW_CATEGORY');
	let showDeleteConfirmation = $state(false);

	const selectedCategories = $derived(
		categoryType === CategoryType.Event ? context.eventCategories : context.tagCategories
	);

	const categoryOptions = $derived([
		{
			label: 'Create new category',
			value: 'NEW_CATEGORY'
		},
		...selectedCategories.map((category) => ({
			label: category.name,
			value: category.id
		}))
	]);

	$effect(() => {
		if (selectedCategoryId === 'NEW_CATEGORY') {
			context.loadCategoryToAddOrEdit(categoryType);
		} else if (selectedCategoryId) {
			context.loadCategoryToAddOrEdit(categoryType, selectedCategoryId);
		}
		showDeleteConfirmation = false;
	});

	async function handleDeleteCategory() {
		if (!context.categoryToCreate.id) return;
		await context.deleteCategory(categoryType, context.categoryToCreate.id, timeline);
		projectActions.closeAndResetModal();
		showDeleteConfirmation = false;
	}

	function handleDeleteClick() {
		showDeleteConfirmation = true;
	}

	function handleCancelDelete() {
		showDeleteConfirmation = false;
	}
</script>

<div class="flex flex-1 flex-col gap-4 p-4">
	<!-- Delete Confirmation Banner -->
	{#if showDeleteConfirmation}
		<div
			class="mb-2 overflow-hidden rounded-lg border-2 border-red-600 bg-red-900/20 transition-all duration-300"
			style="max-height: {showDeleteConfirmation ? '200px' : '0'}; opacity: {showDeleteConfirmation
				? '1'
				: '0'}"
		>
			<div class="flex flex-col gap-3 p-4">
				<p class="text-sm font-semibold text-red-400">
					Are you sure you want to delete "{context.categoryToCreate.name}"?
				</p>
				<p class="text-sm text-gray-300">
					This action cannot be undone.
					{#if categoryType === CategoryType.Event}
						It will remove all timeline events associated with this category buttons. <br />
					{:else}
						It will remove all the tags associated with this category from all timeline events. <br
						/>
					{/if}
				</p>
				<div class="flex gap-2">
					<Button onClick={handleCancelDelete} size="medium">Cancel</Button>
					<Button
						onClick={handleDeleteCategory}
						size="medium"
						customClass="!text-white !bg-red-400 !border-red-600 !border-2 hover:bg-red-500"
					>
						Delete
					</Button>
				</div>
			</div>
		</div>
	{/if}

	<!-- Category Name -->
	<div>
		{#if !categoryIsAlreadyCreated}
			<Dropdown
				label="If you wish to edit an existing category, select it from the dropdown menu."
				options={categoryOptions}
				bind:value={selectedCategoryId}
				size="large"
				selectClass="bg-gray-700 "
			/>
		{/if}
		<div class="mb-4 border-b border-gray-700">
			<span class="text-sm text-gray-100">Category settings</span>
		</div>
		<Input
			horizontal
			label="Name"
			placeholder="enter the name of the category"
			type="text"
			maxlength={20}
			error={context.errorsForm.category?.message}
			bind:value={context.categoryToCreate.name}
		/>
		<Input
			horizontal
			label="Color"
			type="color"
			bind:value={context.categoryToCreate.color}
			inputClass="h-8! w-8! border-0 bg-transparent p-0!"
		/>
	</div>
	<!-- Buttons Table -->
	<div class="mb-2 border-b border-gray-700">
		<span class="text-sm text-gray-100"
			>{context.categoryToCreate.type === CategoryType.Event
				? 'Event button settings'
				: 'Tag button settings'}</span
		>
	</div>
	<ButtonsTable />

	<!-- Delete Category Button -->
	{#if categoryIsAlreadyCreated || selectedCategoryId !== 'NEW_CATEGORY'}
		<div class="mt-2 flex justify-start">
			<Button
				onClick={handleDeleteClick}
				size="medium"
				customClass="!text-white !bg-red-400 !border-red-600 !border-2 hover:bg-red-500 !hover:bg-red-600"
			>
				Delete Category
			</Button>
		</div>
	{/if}
</div>
