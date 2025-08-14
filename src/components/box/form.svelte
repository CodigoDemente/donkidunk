<script lang="ts">
	import { slide } from 'svelte/transition';

	type Props = {
		addCategory: (name: string, color: string) => Promise<void>;
		onclose: () => void;
	};

	let newCategory = $state({
		name: '',
		color: '#ffffff'
	});
	let newCategoryError = $state('');

	let { addCategory, onclose }: Props = $props();
</script>

<div
	class="mt-2 flex flex-col items-start gap-2"
	in:slide={{ duration: 300 }}
	out:slide|local={{ duration: 300 }}
>
	<div class="flex flex-row gap-1">
		<input
			type="text"
			placeholder="Category Name"
			bind:value={newCategory.name}
			onchange={() => (newCategoryError = '')}
			class="h-8 w-full rounded bg-gray-800 p-1 text-white"
		/>
		<input type="color" bind:value={newCategory.color} class="h-8 rounded" />
	</div>

	{#if newCategoryError}
		<div class="mt-1 text-red-500">
			<p>{newCategoryError}</p>
		</div>
	{/if}

	<button
		class="h-8 w-10 cursor-pointer rounded bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-400"
		onclick={async () => {
			newCategoryError = !newCategory.name ? 'Category name is required' : '';

			if (newCategoryError) {
				return;
			}

			await addCategory(newCategory.name, newCategory.color);
			newCategory.name = '';
			newCategory.color = '#ffffff';
			onclose();
		}}
	>
		Add
	</button>
</div>
