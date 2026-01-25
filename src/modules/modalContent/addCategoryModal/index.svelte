<script lang="ts">
	import { CategoryType } from '../../../components/box/types';
	import Dropdown from '../../../components/dropdown/dropdown.svelte';
	import Input from '../../../components/input/input.svelte';
	import { boardContext } from '../../board/context.svelte';
	import ButtonsTable from './buttonsTable.svelte';

	const context = boardContext.get();

	const categoryType = context.categoryToCreate.type;
	const categoryHasButtons = context.categoryToCreate.buttons.length > 0;

	const selectedCategories = $derived(
		categoryType === CategoryType.Event ? context.eventCategories : context.tagCategories
	);

	const categoryOptions = $derived([
		{
			label: 'Create new category',
			value: null
		},
		...selectedCategories.map((category) => ({
			label: category.name,
			value: category.id
		}))
	]);

	let selectedCategoryId = $state<string | null>(null);
	let lastLoadedCategoryId = $state<string | null>(null);

	$effect(() => {
		if (selectedCategoryId && selectedCategoryId !== lastLoadedCategoryId) {
			lastLoadedCategoryId = selectedCategoryId;
			context.loadCategoryToAddOrEdit(categoryType, selectedCategoryId);
		} else if (selectedCategoryId === null && lastLoadedCategoryId !== null) {
			lastLoadedCategoryId = null;
			context.loadCategoryToAddOrEdit(categoryType);
		}
	});
</script>

<div class="flex flex-1 flex-col gap-4 p-4">
	<!-- Category Name -->
	<div>
		{#if !categoryHasButtons}
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
</div>
