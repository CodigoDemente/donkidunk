<script lang="ts">
	import Dropdown from '../../components/dropdown/dropdown.svelte';
	import Input from '../../components/input/input.svelte';
	import type { InputSizes } from '../../components/input/types';
	import Tooltip from '../../components/tooltip/tooltip.svelte';
	import BoardStore from '../../persistence/stores/board/store.svelte';
	import type { Button } from '../../persistence/stores/board/types/Button';
	import type { Option } from '../../utils/options';
	import { inputRawContent } from './utils';

	const boardStore = BoardStore.state;

	let newButton: Button = {
		name: '',
		range: '',
		duration: '',
		before: ''
	};

	function addButton() {
		if (newButton.name) {
			boardStore.category.buttons = [...boardStore.category.buttons, { ...newButton }];
			newButton = { name: '', range: '', duration: '', before: '' };
		}
	}

	function removeButton(idx: number) {
		boardStore.category.buttons = boardStore.category.buttons.filter((_, i) => i !== idx);
	}

	function getLabel(options: Option[], value: string | number) {
		return options.find((opt) => opt.value === value)?.label ?? value;
	}
</script>

<div class="flex flex-1 flex-col gap-4 p-4">
	<!-- Category Name -->
	<div>
		<div class="mb-4 border-b border-gray-700">
			<span class="text-xs text-gray-100">{inputRawContent.firstSection.name}</span>
		</div>
		{#each inputRawContent.firstSection.inputs as input}
			<Input
				horizontal
				label={input.name}
				placeholder={input.placeholder}
				type={input.type}
				bind:value={
					boardStore.category[input.formValue as keyof typeof boardStore.category] as string
				}
				inputClass={input.inputClass}
			/>
		{/each}
	</div>
	<!-- Buttons Table -->
	<div>
		<div class="mb-2 border-b border-gray-700">
			<span class="text-xs text-gray-100">{inputRawContent.secondSection.name}</span>
		</div>
		<table class="w-full rounded bg-gray-700 text-sm text-white">
			<thead>
				<tr>
					{#each inputRawContent.secondSection.tableHeaders as header}
						<th class="p-2 text-left">
							{#if header.tooltip}
								<Tooltip size="medium" text={header.tooltip} info>{header.text}</Tooltip>
							{:else}
								{header.text}
							{/if}
						</th>
					{/each}
				</tr>
			</thead>
			<tbody>
				{#each boardStore.category.buttons as btn, idx}
					<tr>
						{#each inputRawContent.secondSection.tableInputs as input}
							<td class="p-2">
								{#if input.options}
									{getLabel(
										input.options as Option[],
										btn[input.formValue as keyof typeof btn] as string
									)}
								{:else}
									{btn[input.formValue as keyof typeof btn]}
								{/if}
							</td>
						{/each}
						<td class="p-2">
							<button class="text-red-400 hover:text-red-600" onclick={() => removeButton(idx)}
								>&times;</button
							>
						</td>
					</tr>
				{/each}
				<tr>
					{#each inputRawContent.secondSection.tableInputs as input}
						<td class="p-2">
							{#if input.type === 'dropdown'}
								<Dropdown
									placeholder={input.placeholder}
									options={input.options}
									size={input.size as InputSizes}
									selectClass="bg-gray-800"
									noErrors
									bind:value={newButton[input.formValue as keyof typeof newButton] as string}
								/>
							{/if}
							{#if input.type === 'input'}
								<Input
									placeholder={input.placeholder}
									inputClass="bg-gray-800"
									type="text"
									size={input.size as InputSizes}
									maxlength={15}
									noErrors
									bind:value={newButton[input.formValue as keyof typeof newButton] as string}
								/>
							{/if}
						</td>
					{/each}
					<td class="p-2">
						<button class="text-green-400 hover:text-green-600" onclick={addButton}>+</button>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</div>
