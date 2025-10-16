<script lang="ts">
	import { IconTrash } from '@tabler/icons-svelte';
	import { CategoryType } from '../../../components/box/types';
	import Button from '../../../components/button/button.svelte';
	import Dropdown from '../../../components/dropdown/dropdown.svelte';
	import Input from '../../../components/input/input.svelte';
	import Tooltip from '../../../components/tooltip/tooltip.svelte';
	import { boardContext } from '../../board/context.svelte';
	import { ButtonRange, type Button as ButtonType } from '../../board/types/Button';
	import { secondsOptions, typeOptions } from './utils';

	const context = boardContext.get();

	const initialButton: ButtonType = {
		id: -1,
		name: '',
		range: ButtonRange.DYNAMIC,
		duration: null,
		before: null,
		temp: true
	};

	let newButton = $state(initialButton);

	function addButton() {
		newButton.temp = false;
		newButton = initialButton;
		context.categoryToCreate.buttons = [...context.categoryToCreate.buttons, { ...newButton }];
		newButton = context.categoryToCreate.buttons[context.categoryToCreate.buttons.length - 1];
	}

	function removeButton(idx: number) {
		context.categoryToCreate.buttons = context.categoryToCreate.buttons.filter((_, i) => i !== idx);
	}
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
	<div>
		<div class="mb-2 border-b border-gray-700">
			<span class="text-sm text-gray-100">Button settings</span>
		</div>
		<table class="w-full rounded bg-gray-700 text-sm text-white">
			<thead>
				<tr>
					<th class="w-2/5 min-w-[120px] p-2 text-left">Name</th>
					<th class="w-1/5 min-w-[80px] p-2 text-left">Range</th>
					{#if context.categoryToCreate.type === CategoryType.Action}
						<th class="w-1/5 min-w-[80px] p-2 text-left">
							<Tooltip
								size="medium"
								text="Enabled ONLY when it is an action type: The duration of the button's action"
								info
							>
								Duration
							</Tooltip>
						</th>
						<th class="w-1/5 min-w-[80px] p-2 text-left">
							<Tooltip size="medium" text="Time lapse starting before the click" info>
								Before
							</Tooltip>
						</th>
					{/if}
					<th class="w-8 p-2"></th>
				</tr>
			</thead>
			<tbody>
				{#if context.categoryToCreate.buttons.length === 0}
					<tr>
						<td
							colspan={context.categoryToCreate.type === CategoryType.Action ? 5 : 3}
							class="px-4 py-6 text-center text-gray-400"
						>
							{#if context.errorsForm.buttons}
								<p class="mt-2 w-full text-xs text-red-400">{context.errorsForm.buttons.message}</p>
							{/if}
							No buttons yet. Click <span class="text-tertiary font-semibold">ADD BUTTON</span> to add
							your first button.
						</td>
					</tr>
				{:else}
					{#each context.categoryToCreate.buttons as btn, idx (idx)}
						<tr class="border-b border-gray-600 last:border-b-0">
							<td class="w-2/5 min-w-[120px] p-2">
								<Input
									placeholder="Write here the button name..."
									inputClass="bg-gray-800"
									type="text"
									size="medium"
									maxlength={15}
									error={context.errorsForm[idx]?.message}
									bind:value={btn.name}
								/>
							</td>
							<td class="w-1/5 min-w-[80px] p-2">
								<Dropdown
									placeholder="Select range"
									options={typeOptions}
									size="small"
									selectClass="bg-gray-800"
									disabled={context.categoryToCreate.type === CategoryType.Event}
									bind:value={btn.range}
								/>
							</td>
							{#if context.categoryToCreate.type === CategoryType.Action}
								{#if btn.range === ButtonRange.FIXED}
									<td class="w-1/5 min-w-[80px] p-2">
										<Dropdown
											placeholder="Select duration"
											options={secondsOptions}
											size="mini"
											selectClass="bg-gray-800"
											bind:value={btn.duration}
										/>
									</td>
									<td class="w-1/5 min-w-[80px] p-2">
										<Dropdown
											placeholder="Select before"
											options={secondsOptions}
											size="mini"
											selectClass="bg-gray-800"
											bind:value={btn.before}
										/>
									</td>
								{:else}
									<td class="w-1/5 min-w-[80px] p-2"></td>
									<td class="w-1/5 min-w-[80px] p-2"></td>
								{/if}
							{/if}
							<td class="w-8 p-2 text-right">
								<button
									class="text-gray-200 hover:cursor-pointer hover:text-white"
									onclick={() => removeButton(idx)}
								>
									<IconTrash class="h-4 w-4" />
								</button>
							</td>
						</tr>
					{/each}
				{/if}
				<tr>
					<td colspan={context.categoryToCreate.type === CategoryType.Action ? 5 : 3} class="p-2">
						<div class="flex justify-center">
							<Button
								onClick={addButton}
								size="large"
								tertiary
								customClass="self-end justify-center"
							>
								<p class="text-xs leading-5">ADD BUTTON</p>
							</Button>
						</div>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</div>
