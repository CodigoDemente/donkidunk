<script lang="ts">
	import { IconTrash } from '@tabler/icons-svelte';
	import { v7 as uuidv7 } from 'uuid';
	import Button from '../../../components/button/button.svelte';
	import Dropdown from '../../../components/dropdown/dropdown.svelte';
	import Input from '../../../components/input/input.svelte';
	import Tooltip from '../../../components/tooltip/tooltip.svelte';
	import { boardContext } from '../../board/context.svelte';
	import { CategoryType } from '../../../components/box/types';
	import { ButtonRange, type Button as ButtonType } from '../../board/types/Button';
	import { secondsBeforeOptions, secondsDurationOptions, typeOptions } from './utils';
	import type { Tag } from '../../board/types/Tag';

	const context = boardContext.get();

	const isEventType = context.categoryToCreate.type === CategoryType.Event;
	const isTagType = context.categoryToCreate.type === CategoryType.Tag;

	// These two are functions so that the id is generated every time a new button or tag is added
	const initialButton = (): ButtonType => ({
		id: uuidv7(),
		name: '',
		color: '',
		range: ButtonRange.DYNAMIC,
		duration: null,
		before: null
	});

	const initialTag = (): Tag => ({
		id: uuidv7(),
		name: '',
		color: ''
	});

	let newButton = $state(initialButton());
	let newTag = $state(initialTag());
	let buttonToDeleteIdx = $state<number | null>(null);

	const buttonToDeleteName = $derived(
		buttonToDeleteIdx !== null
			? context.categoryToCreate.buttons[buttonToDeleteIdx]?.name || `#${buttonToDeleteIdx + 1}`
			: ''
	);

	function handleRemoveClick(idx: number) {
		buttonToDeleteIdx = idx;
	}

	function confirmRemoveButton() {
		if (buttonToDeleteIdx === null) return;
		removeButton(buttonToDeleteIdx);
		buttonToDeleteIdx = null;
	}

	function cancelRemoveButton() {
		buttonToDeleteIdx = null;
	}

	function addButton() {
		if (isEventType) {
			newButton.color = context.categoryToCreate.color;
			const button = { ...newButton };
			context.categoryToCreate.buttons = [
				...context.categoryToCreate.buttons,
				button
			] as ButtonType[];
			newButton = initialButton();
		} else if (isTagType) {
			newTag.color = context.categoryToCreate.color;
			const tag = { ...newTag };
			context.categoryToCreate.buttons = [...context.categoryToCreate.buttons, tag] as Tag[];
			newTag = initialTag();
		}
	}

	function removeButton(idx: number) {
		context.categoryToCreate = {
			...context.categoryToCreate,
			buttons: context.categoryToCreate.buttons.filter((_, i) => i !== idx)
		};
	}
</script>

{#if buttonToDeleteIdx !== null}
	<div
		class="mb-2 overflow-hidden rounded-lg border-2 border-red-600 bg-red-900/20 transition-all duration-300"
	>
		<div class="flex flex-col gap-3 p-4">
			<p class="text-sm font-semibold text-red-400">
				Are you sure you want to remove "{buttonToDeleteName}"?
			</p>
			<p class="text-sm text-gray-300">
				{#if isEventType}
					All timeline events associated with this button will be removed when the category is
					saved.
				{:else}
					All tags associated with this tag button will be removed from timeline events when the
					category is saved.
				{/if}
			</p>
			<div class="flex gap-2">
				<Button onClick={cancelRemoveButton} size="medium">Cancel</Button>
				<Button
					onClick={confirmRemoveButton}
					size="medium"
					customClass="!text-white !bg-red-400 !border-red-600 !border-2 hover:bg-red-500"
				>
					Remove
				</Button>
			</div>
		</div>
	</div>
{/if}

<div class="max-h-[400px] overflow-x-hidden overflow-y-auto rounded bg-gray-700">
	<table class="w-full table-fixed text-sm text-white">
		<thead class="sticky top-0 z-2 bg-gray-700">
			<tr>
				<th class="w-[180px] p-2 text-left">Name</th>
				<th class="w-[60px] p-2 text-left">Color</th>
				{#if isEventType}
					<th class="w-[140px] p-2 text-left">Range</th>
					<th class="w-[100px] p-2 text-left">
						<Tooltip
							size="medium"
							text="Set the duration of the button's action. Enabled ONLY when it is a Fixed range."
							info
							position="bottom"
						>
							Duration
						</Tooltip>
					</th>
					<th class="w-[100px] p-2 text-left">
						<Tooltip
							size="medium"
							text="Time lapse before the click. Enabled ONLY when it is a Fixed range."
							position="bottom"
							info>Pre-delay</Tooltip
						>
					</th>
				{/if}
				<th class="w-[60px] p-2"></th>
			</tr>
		</thead>
		<tbody>
			{#if context.categoryToCreate.buttons.length === 0}
				<tr>
					<td colspan={isEventType ? 6 : 3} class="px-4 py-6 text-center text-gray-400">
						{#if context.errorsForm.buttons}
							<p class="mt-2 w-full text-sm text-red-400">{context.errorsForm.buttons.message}</p>
						{/if}
						No buttons yet. Click
						<span class="text-tertiary font-semibold">{isEventType ? 'ADD BUTTON' : 'ADD TAG'}</span
						>
						to add your first {isEventType ? 'button' : 'tag'}.
					</td>
				</tr>
			{:else}
				{#each context.categoryToCreate.buttons as btn, idx (idx)}
					<tr class="border-b border-gray-600 last:border-b-0">
						<td class="w-[180px] p-2">
							<Input
								placeholder="Write here the button name..."
								inputClass="bg-gray-800"
								type="text"
								size="medium"
								maxlength={255}
								error={context.errorsForm[idx]?.message}
								bind:value={btn.name}
							/>
						</td>
						<td class="w-[60px] p-2">
							<Input
								type="color"
								bind:value={btn.color}
								inputClass="h-8! w-8! border-0 bg-transparent p-0!"
							/>
						</td>
						{#if isEventType && 'range' in btn}
							<td class="w-[140px] p-2">
								<Dropdown
									placeholder="Select range"
									options={typeOptions}
									size="medium"
									selectClass="bg-gray-800"
									bind:value={btn.range}
								/>
							</td>

							{#if btn.range === ButtonRange.FIXED}
								<td class="w-[100px] p-2">
									<Dropdown
										placeholder="Select duration"
										options={secondsDurationOptions}
										size="small"
										selectClass="bg-gray-800"
										bind:value={btn.duration}
									/>
								</td>
								<td class="w-[100px] p-2">
									<Dropdown
										placeholder="Select before"
										options={secondsBeforeOptions}
										size="small"
										selectClass="bg-gray-800"
										bind:value={btn.before}
									/>
								</td>
							{:else}
								<td class="w-[100px] p-2"></td>
								<td class="w-[100px] p-2"></td>
							{/if}
						{/if}

						<td class="w-[60px] p-2 pr-10 text-right">
							<button
								class="text-gray-200 hover:cursor-pointer hover:text-white"
								onclick={() => handleRemoveClick(idx)}
							>
								<IconTrash class="h-4 w-4" />
							</button>
						</td>
					</tr>
				{/each}
			{/if}
			<tr class="sticky bottom-0 z-5 bg-gray-700">
				<td colspan={isEventType ? 6 : 3} class="p-2">
					<div class="flex justify-center">
						<Button onClick={addButton} size="large" tertiary customClass="self-end justify-center">
							<p class="text-sm leading-5">{isEventType ? 'ADD BUTTON' : 'ADD TAG'}</p>
						</Button>
					</div>
				</td>
			</tr>
		</tbody>
	</table>
</div>
