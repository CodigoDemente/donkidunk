<script lang="ts">
	import Dropdown from '../../components/dropdown/dropdown.svelte';
	import Input from '../../components/input/input.svelte';
	import type { InputSizes } from '../../components/input/types';
	import Tooltip from '../../components/tooltip/tooltip.svelte';
	import type { Option } from '../../utils/options';
	import { boardContext } from '../board/context.svelte';
	import type { Button } from '../board/types/Button';
	import { inputRawContent } from './utils';

	const context = boardContext.get();

	const initialButton: Button = {
		id: 0,
		name: '',
		range: '',
		duration: 0,
		before: false
	};

	let newButton = initialButton;

	function addButton() {
		if (newButton.name) {
			context.categoryToCreate.buttons = [...context.categoryToCreate.buttons, { ...newButton }];
			newButton = initialButton;
		}
	}

	function removeButton(idx: number) {
		context.categoryToCreate.buttons = context.categoryToCreate.buttons.filter((_, i) => i !== idx);
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
		{#each inputRawContent.firstSection.inputs as input (input.formValue)}
			<Input
				horizontal
				label={input.name}
				placeholder={input.placeholder}
				type={input.type}
				bind:value={
					context.categoryToCreate[
						input.formValue as keyof typeof context.categoryToCreate
					] as string
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
					{#each inputRawContent.secondSection.tableHeaders as header (header.text)}
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
				{#each context.categoryToCreate.buttons as btn, idx (btn.id)}
					<tr>
						{#each inputRawContent.secondSection.tableInputs as input (input.formValue)}
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
					{#each inputRawContent.secondSection.tableInputs as input (input.formValue)}
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
