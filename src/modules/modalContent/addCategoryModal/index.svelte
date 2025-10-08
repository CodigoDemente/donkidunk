<script lang="ts">
	import { CategoryType } from '../../../components/box/types';
	import Dropdown from '../../../components/dropdown/dropdown.svelte';
	import Input from '../../../components/input/input.svelte';
	import Tooltip from '../../../components/tooltip/tooltip.svelte';
	import type { Option } from '../../../utils/options';
	import { boardContext } from '../../board/context.svelte';
	import { ButtonRange, type Button } from '../../board/types/Button';
	import { secondsOptions, typeOptions } from './utils';

	const context = boardContext.get();

	const initialButton: Button = {
		id: -1,
		name: '',
		range: ButtonRange.DYNAMIC,
		duration: null,
		before: null,
		temp: true
	};

	let showForm = $state(false);
	let newButton = $state(initialButton);

	function addButton() {
		if (!showForm) {
			showForm = true;
		}

		newButton.temp = false;
		newButton = initialButton;
		context.categoryToCreate.buttons = [...context.categoryToCreate.buttons, { ...newButton }];
		newButton = context.categoryToCreate.buttons[context.categoryToCreate.buttons.length - 1];
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
			<span class="text-xs text-gray-100">Category settings</span>
		</div>
		<Input
			horizontal
			label="Name"
			placeholder="enter the name of the category"
			type="text"
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
	<div>
		<div class="mb-2 border-b border-gray-700">
			<span class="text-xs text-gray-100">Button settings</span>
		</div>
		<table class="w-full rounded bg-gray-700 text-sm text-white">
			<thead>
				<tr>
					<th class="p-2 text-left">Name</th>
					<th class="p-2 text-left">Range</th>
					{#if context.categoryToCreate.type === CategoryType.Action}
						<th class="p-2 text-left">
							<Tooltip
								size="medium"
								text="Enabled ONLY when it is an action type: The duration of the button's action"
								info
							>
								Duration
							</Tooltip>
						</th>
						<th class="p-2 text-left">
							<Tooltip size="medium" text="Time lapse starting before the click" info>
								Before
							</Tooltip>
						</th>
					{/if}
				</tr>
			</thead>
			<tbody>
				{#each context.categoryToCreate.buttons.filter((btn) => !btn.temp) as btn, idx ((btn.id, idx))}
					<tr>
						<td class="p-2">{btn.name}</td>
						<td class="p-2">{getLabel(typeOptions, btn.range as string)}</td>
						{#if context.categoryToCreate.type === CategoryType.Action}
							<td class="p-2">{getLabel(secondsOptions, btn.duration as number)}</td>
							<td class="p-2">{getLabel(secondsOptions, btn.before as number)}</td>
						{/if}
						<td class="p-2">
							<button class="text-red-400 hover:text-red-600" onclick={() => removeButton(idx)}
								>&times;</button
							>
						</td>
					</tr>
				{/each}
				{#if showForm}
					<tr>
						<td class="p-2">
							<Input
								placeholder="Write here the button name..."
								inputClass="bg-gray-800"
								type="text"
								size="medium"
								maxlength={15}
								noErrors
								bind:value={newButton.name}
							/>
						</td>
						<td class="p-2">
							<Dropdown
								placeholder="Select range"
								options={typeOptions}
								size="small"
								selectClass="bg-gray-800"
								disabled={context.categoryToCreate.type === CategoryType.Event}
								noErrors
								bind:value={newButton.range}
							/>
						</td>
						{#if context.categoryToCreate.type === CategoryType.Action && newButton.range === ButtonRange.FIXED}
							<td class="p-2">
								<Dropdown
									placeholder="Select duration"
									options={secondsOptions}
									size="mini"
									selectClass="bg-gray-800"
									noErrors
									bind:value={newButton.duration}
								/>
							</td>
							<td class="p-2">
								<Dropdown
									placeholder="Select before"
									options={secondsOptions}
									size="mini"
									selectClass="bg-gray-800"
									noErrors
									bind:value={newButton.before}
								/>
							</td>
						{/if}
					</tr>
				{/if}
				<tr>
					<td
						colspan={context.categoryToCreate.type === CategoryType.Action ? 4 : 2}
						class="p-2 text-center text-gray-300"
					>
						<button class="text-green-400 hover:text-green-600" onclick={addButton}>+</button>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</div>
