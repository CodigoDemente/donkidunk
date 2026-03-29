<script lang="ts">
	import Button from '../../../components/button/button.svelte';
	import Multiselect from '../../../components/multiselect';
	import type { ExportingRule } from '../types';
	import type { Button as BoardButton } from '../../board/types/Button';
	import type { Tag } from '../../board/types/Tag';

	interface Props {
		addRule: () => void;
		newRule: ExportingRule;
		eventButtons: BoardButton[];
		tagsForSelectedButton: Tag[];
	}

	let { addRule, newRule, eventButtons, tagsForSelectedButton }: Props = $props();

	const tagMultiselectOptions = $derived(
		tagsForSelectedButton.map((tag) => ({
			id: tag.id,
			value: tag.id,
			label: tag.name,
			color: tag.color
		}))
	);
</script>

<div class="flex flex-col gap-2">
	<Button customClass="self-end" tertiary size="large" onClick={() => addRule()}
		>Add this rule</Button
	>

	<div class="grid grid-cols-2 gap-4">
		<div class="flex flex-col gap-2">
			<p class="text-base text-gray-200">Select the event you want to appear:</p>
			<div class="grid max-h-58 grid-cols-2 gap-2 overflow-y-auto">
				{#each eventButtons as eventButton (eventButton.id)}
					<label
						class="flex cursor-pointer items-center gap-2 rounded border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 transition-colors hover:bg-gray-700
						{newRule.include === eventButton.id ? 'border-primary bg-gray-700' : ''}"
					>
						<input
							type="radio"
							name="event-radio"
							value={eventButton.id}
							checked={newRule.include === eventButton.id}
							onchange={() => {
								newRule.include = eventButton.id;
								newRule.taggedWith = [];
							}}
							class="accent-primary h-4 w-4 cursor-pointer"
						/>
						<span>{eventButton.name}</span>
					</label>
				{/each}
			</div>
		</div>
		<div class="flex flex-col gap-2">
			<p class="text-base text-gray-200">Select the related tags:</p>
			<Multiselect
				options={tagMultiselectOptions}
				size="full"
				selectClass="bg-gray-800 min-h-22"
				bind:selectedValues={newRule.taggedWith}
			/>
		</div>
	</div>
</div>
