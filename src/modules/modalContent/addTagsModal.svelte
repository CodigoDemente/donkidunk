<script lang="ts">
	import { IconTrash } from '@tabler/icons-svelte';
	import Button from '../../components/button/button.svelte';
	import Input from '../../components/input/input.svelte';
	import type { Tag } from '../board/types/Tag';
	import { boardContext } from '../board/context.svelte';
	import { onMount } from 'svelte';

	const context = boardContext.get();

	const initialTag: Tag = { name: '', color: '#8888ff' };
	let newTag: Tag = initialTag;

	function addTag() {
		context.tagsListToCreate.push({ ...newTag });
		newTag = initialTag;
	}

	function removeTag(idx: number) {
		context.tagsListToCreate.splice(idx, 1);
		context.resetErrorsForm();
	}

	onMount(() => {
		context.tagsListToCreate.push(...context.tagsRelatedToEvents);
	});
</script>

<div class="flex max-h-[600px] min-h-[600px] flex-col gap-4 overflow-y-auto p-4">
	<Button onClick={addTag} size="small" tertiary customClass="self-end justify-center">
		<p class="text-xs leading-5">ADD TAG</p>
	</Button>
	<table class="w-full rounded border border-gray-600 bg-gray-700 text-sm text-white">
		<thead>
			<tr>
				<th class="w-2/3 min-w-[180px] border-b border-gray-600 p-2 text-left">Name</th>
				<th class="w-1/4 min-w-[80px] border-b border-l border-gray-600 p-2 text-left">Color</th>
				<th class="w-8 border-b border-gray-600 p-2"></th>
			</tr>
		</thead>
		<tbody>
			{#if context.tagsListToCreate.length === 0}
				<tr>
					<td colspan="3" class="px-4 py-12 text-center text-gray-400">
						No tags yet. Click <span class="text-tertiary font-semibold">ADD TAG</span> to create your
						first tag.
					</td>
				</tr>
			{:else}
				{#each context.tagsListToCreate as tag, idx (idx)}
					<tr class="border-b border-gray-600 last:border-b-0">
						<td class="w-2/3 min-w-[180px] p-2">
							<Input
								placeholder="enter tag name here"
								type="text"
								maxlength={15}
								bind:value={tag.name}
								inputClass="bg-gray-800 mt-2"
								error={context.errorsForm[idx]?.message}
							/>
						</td>
						<td class="w-1/4 min-w-[80px] p-2">
							<Input
								type="color"
								bind:value={tag.color}
								inputClass="h-8! w-8! border-0 bg-transparent p-0! hover:cursor-pointer"
							/>
						</td>
						<td class="w-8 p-2">
							<button
								class="text-gray-200 hover:cursor-pointer hover:text-white"
								onclick={() => removeTag(idx)}
							>
								<IconTrash class="h-4 w-4" />
							</button>
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
</div>
