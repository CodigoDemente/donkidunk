<script lang="ts">
	import Input from '../../../components/input/input.svelte';
	import { configContext } from '../../config/context.svelte';
	import Checkbox from '../../../components/checkbox/checkbox.svelte';

	let boardName = $state('');
	let isDefault = $state(false);
	let warning = $state('');

	const config = configContext.get();

	// Sync local state with projectStore
	$effect(() => {
		config.newButtonBoardFormData = {
			boardName,
			isDefault
		};

		if (config.buttonBoards.find((b) => b.name === boardName)) {
			warning = 'A board with this name already exists, it will be overwritten';
		} else {
			warning = '';
		}
	});
</script>

<div class="flex w-full flex-col gap-10 px-4 pt-4 pb-8">
	<p class="border-b border-gray-500 text-sm text-gray-200">
		To save a button board, indicate here its name:
	</p>
	<div class="flex w-full items-end gap-2">
		<Input
			label="Board name"
			placeholder="Enter the name of the board..."
			type="text"
			bind:value={boardName}
			size="large"
			inputClass="bg-gray-700"
			noErrors
			{warning}
		/>
	</div>

	<div class="flex items-end gap-2">
		<Checkbox label="Default board" bind:checked={isDefault} />
	</div>
</div>
