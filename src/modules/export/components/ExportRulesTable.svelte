<script lang="ts">
	import { IconTrash, IconChevronUp, IconChevronDown } from '@tabler/icons-svelte';
	import Tag from '../../../components/tag/tag.svelte';
	import Tooltip from '../../../components/tooltip/tooltip.svelte';
	import type { ExportContext } from '../context.svelte';

	interface Props {
		context: ExportContext;
	}

	let { context }: Props = $props();
</script>

<div class="relative min-h-[200px]">
	<table class="w-full border border-gray-600">
		<thead class="sticky top-0 z-10 bg-gray-800">
			<tr>
				<th class="w-[200px] border-r border-b border-gray-600 px-4 py-2 text-left"> Include </th>
				<th class="border-r border-b border-gray-600 px-4 py-2 text-left">Tagged with</th>
				<th class="w-[100px] border-b border-gray-600 px-2 py-2 text-center">Actions</th>
			</tr>
		</thead>
		<tbody>
			{#if context.rules.length === 0}
				<tr>
					<td colspan="3" class="px-4 py-8 text-center text-gray-400">
						The table is empty, add rule to start exporting your video
					</td>
				</tr>
			{:else}
				{#each context.rules as rule, idx (idx)}
					<tr class="border-b border-gray-700">
						<td class="w-[200px] border-r border-gray-600 px-4 py-3">
							<div class="truncate" title={context.getEventLabel(rule.include)}>
								{context.getEventLabel(rule.include)}
							</div>
						</td>
						<td class="border-r border-gray-600 px-4 py-3">
							<div class="max-h-24 overflow-y-auto">
								<div class="flex flex-wrap gap-2">
									{#if rule.taggedWith.length === 0}
										<span class="text-sm text-gray-500">No tags</span>
									{:else}
										{#each rule.taggedWith as tagId (tagId)}
											{@const tag = context.getTagById(tagId)}
											{#if tag}
												<Tag color={tag.color} text={tag.name} disabled />
											{/if}
										{/each}
									{/if}
								</div>
							</div>
						</td>
						<td class="px-2 py-3">
							<div class="flex items-center justify-center gap-1">
								<Tooltip text="Move up" size="medium" position="bottom" disabled={idx === 0}>
									<button
										class="cursor-pointer rounded p-1 text-gray-400 transition-colors hover:text-white disabled:pointer-events-none disabled:opacity-30"
										disabled={idx === 0}
										onclick={() => context.moveRuleUp(idx)}
									>
										<IconChevronUp size={16} />
									</button>
								</Tooltip>
								<Tooltip
									text="Move down"
									size="medium"
									position="bottom"
									disabled={idx === context.rules.length - 1}
								>
									<button
										class="cursor-pointer rounded p-1 text-gray-400 transition-colors hover:text-white disabled:pointer-events-none disabled:opacity-30"
										disabled={idx === context.rules.length - 1}
										onclick={() => context.moveRuleDown(idx)}
									>
										<IconChevronDown size={16} />
									</button>
								</Tooltip>
								<Tooltip text="Delete" size="medium" position="bottom">
									<button
										class="hover:text-tertiary cursor-pointer rounded p-1 text-gray-400 transition-colors"
										onclick={() => context.deleteRule(idx)}
									>
										<IconTrash size={16} />
									</button>
								</Tooltip>
							</div>
						</td>
					</tr>
				{/each}
			{/if}
		</tbody>
	</table>
	<p class="mt-2 text-sm text-gray-400">
		* The videos will be exported in the order the rules are listed in the table (soon you will be
		able to choose a custom order from the videos extracted).
	</p>
</div>
