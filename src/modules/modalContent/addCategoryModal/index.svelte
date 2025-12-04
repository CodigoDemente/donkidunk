<script lang="ts">
	import { CategoryType } from '../../../components/box/types';
	import Input from '../../../components/input/input.svelte';
	import { boardContext } from '../../board/context.svelte';
	import ButtonsTable from './buttonsTable.svelte';

	const context = boardContext.get();
</script>

<div class="flex flex-1 flex-col gap-4 p-4">
	<!-- Category Name -->
	<div>
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
