<script lang="ts">
	import Button from '../../../components/button/button.svelte';
	import Multiselect from '../../../components/multiselect';
	import type { ExportContext } from '../context.svelte';

	interface Props {
		context: ExportContext;
	}

	let { context = $bindable() }: Props = $props();
</script>

<div class="relative mt-auto border-t border-gray-600 pt-4">
	<!-- Button in top right corner -->
	<div class="absolute top-0 right-0 pt-2">
		<Button customClass="" tertiary size="large" onClick={() => context.addRule()}
			>Add this rule</Button
		>
	</div>

	<div class="grid grid-cols-2 gap-4">
		<div class="flex flex-col gap-2">
			<p class="text-base text-gray-400">Choose the event you want to appear:</p>
			<div class="grid max-h-58 grid-cols-2 gap-2 overflow-y-auto">
				{#each context.allEventOptions as option (option.value)}
					<label
						class="flex cursor-pointer items-center gap-2 rounded border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 transition-colors hover:bg-gray-700 {context
							.newRule.include === option.value
							? 'border-primary bg-gray-700'
							: ''}"
					>
						<input
							type="radio"
							name="event-radio"
							value={option.value}
							checked={context.newRule.include === option.value}
							onchange={() => {
								context.newRule.include = option.value;
								context.newRule.taggedWith = [];
							}}
							class="accent-primary h-4 w-4 cursor-pointer"
						/>
						<span>{option.label}</span>
					</label>
				{/each}
			</div>
		</div>
		<div class="flex flex-col gap-2">
			<p class="text-base text-gray-400">Choose the related tags:</p>
			<Multiselect
				options={context.availableTags}
				size="full"
				selectClass="bg-gray-800"
				bind:selectedValues={context.newRule.taggedWith}
			/>
		</div>
	</div>
</div>
