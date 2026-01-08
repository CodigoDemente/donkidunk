<script lang="ts">
	import { Channel } from '@tauri-apps/api/core';
	import ProjectStore from '../../persistence/stores/project/store.svelte';
	import { boardContext } from '../../modules/board/context.svelte';
	import { TimelineRepositoryFactory } from '../../factories/TimelineRepositoryFactory';
	import { save } from '@tauri-apps/plugin-dialog';
	import { path } from '@tauri-apps/api';
	import type { ExportEvent } from '../../events/types/ExportEvent';
	import { debug } from '@tauri-apps/plugin-log';
	import type { ExportingRule } from './types';
	import { CategoryType } from '../../components/box/types';
	import Multiselect from '../../components/multiselect';
	import { cutVideo } from './commands/CutVideo';
	import Button from '../../components/button/button.svelte';
	import Tag from '../../components/tag/tag.svelte';
	import { getTextColorForBackground } from '../../components/box/colors';

	const board = boardContext.get();
	const timelineRepository = TimelineRepositoryFactory.getInstance();

	let exportingRules: ExportingRule[] = $state([]);

	const allEventOptions = Object.values(board.eventButtonsById).map((button) => ({
		value: button.id,
		label: button.name
	}));

	const allTags = Object.values(board.tagsById).map((tag) => ({
		id: tag.id,
		value: tag.id,
		label: tag.name,
		color: tag.color
	}));

	const initialRule: ExportingRule = {
		type: CategoryType.Event,
		include: '',
		taggedWith: [],
		temp: true
	};

	let newRule = $state({ ...initialRule });

	function addRule() {
		// Add the current rule to the table
		if (newRule.include) {
			exportingRules = [...exportingRules, { ...newRule, temp: false }];
			// Reset form to initial state
			newRule = { ...initialRule };
		}
	}

	function getEventLabel(eventId: string): string {
		return board.eventButtonsById[eventId]?.name || eventId;
	}

	function getTagById(tagId: string) {
		return board.tagsById[tagId];
	}

	const projectStore = ProjectStore.getState();
	let exporting = $state(false);
	let export_progress = $state(0);

	async function export_video(): Promise<void> {
		// Fix initial values just in case
		exporting = false;
		export_progress = 0;

		const inVideoFolder = await path.dirname(projectStore.video.path!);

		const outPath = await save({
			title: 'Select output video file',
			defaultPath: inVideoFolder,
			filters: [{ name: 'Video', extensions: ['mp4'] }]
		});

		if (!outPath) {
			return;
		}

		exporting = true;

		const ranges = await timelineRepository.getRangesForExport(exportingRules);

		const onEvent = new Channel<ExportEvent>();
		onEvent.onmessage = (message) => {
			const progress = message.progress;
			debug(`Exporting progress: ${message.progress}`);
			export_progress = Math.trunc(progress * 100);
		};

		await cutVideo(projectStore.video.path!, outPath, ranges, onEvent);

		exporting = false;
	}
</script>

<div class="flex h-full w-full flex-col gap-1 p-4">
	<h2 class="text-lg font-bold">Export your video</h2>
	<div class="flex w-full border-b border-gray-300" role="separator"></div>

	<!-- Main content area -->
	<div class="flex-1 overflow-y-auto">
		<div class="relative min-h-[200px]">
			<table class="w-full border border-gray-600">
				<thead class="sticky top-0 z-10 bg-gray-800">
					<tr>
						<th class="w-[200px] border-r border-b border-gray-600 px-4 py-2 text-left">
							Include
						</th>
						<th class="border-b border-gray-600 px-4 py-2 text-left">Tagged with</th>
					</tr>
				</thead>
				<tbody>
					{#if exportingRules.length === 0}
						<tr>
							<td colspan="2" class="px-4 py-8 text-center text-gray-400">
								The table is empty, add rule to start exporting your video
							</td>
						</tr>
					{:else}
						{#each exportingRules as rule, idx (idx)}
							<tr class="border-b border-gray-700">
								<td class="w-[200px] border-r border-gray-600 px-4 py-3">
									<div class="truncate" title={getEventLabel(rule.include)}>
										{getEventLabel(rule.include)}
									</div>
								</td>
								<td class="px-4 py-3">
									<div class="max-h-24 overflow-y-auto">
										<div class="flex flex-wrap gap-2">
											{#if rule.taggedWith.length === 0}
												<span class="text-sm text-gray-500">No tags</span>
											{:else}
												{#each rule.taggedWith as tagId (tagId)}
													{@const tag = getTagById(tagId)}
													{#if tag}
														<Tag color={tag.color} text={tag.name} disabled />
													{/if}
												{/each}
											{/if}
										</div>
									</div>
								</td>
							</tr>
						{/each}
					{/if}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Form always visible at the bottom -->
	<div class="relative mt-auto border-t border-gray-600 pt-4">
		<!-- Button in top right corner -->
		<div class="absolute top-0 right-0 pt-2">
			<Button customClass="" tertiary size="medium" onClick={addRule}>Add this rule</Button>
		</div>

		<div class="grid grid-cols-2 gap-4">
			<div class="flex flex-col gap-2">
				<p class="text-sm text-gray-400">Choose the event you want to appear:</p>
				<div class="grid max-h-58 grid-cols-2 gap-2 overflow-y-auto">
					{#each allEventOptions as option (option.value)}
						<label
							class="flex cursor-pointer items-center gap-2 rounded border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-200 transition-colors hover:bg-gray-700 {newRule.include ===
							option.value
								? 'border-primary bg-gray-700'
								: ''}"
						>
							<input
								type="radio"
								name="event-radio"
								value={option.value}
								checked={newRule.include === option.value}
								onchange={() => {
									newRule.include = option.value;
								}}
								class="accent-primary h-4 w-4 cursor-pointer"
							/>
							<span>{option.label}</span>
						</label>
					{/each}
				</div>
			</div>
			<div class="flex flex-col gap-2">
				<p class="text-sm text-gray-400">Choose the related tags:</p>
				<Multiselect
					options={allTags}
					size="full"
					selectClass="bg-gray-800"
					bind:selectedValues={newRule.taggedWith}
				/>
			</div>
		</div>
	</div>

	<Button
		customClass="self-center my-8"
		primary
		size="large"
		onClick={export_video}
		disabled={exporting}>Export Video</Button
	>
	{#if exporting}
		<p class="mt-2 text-sm text-gray-600">Exporting video, please wait...</p>

		<div class="w-full rounded-full bg-gray-200 dark:bg-gray-700">
			<div
				class="rounded-full bg-blue-600 p-0.5 text-center text-xs leading-none font-medium text-blue-100
				transition-[width] duration-150 ease-in"
				style="width: {export_progress}%"
			>
				{export_progress}%
			</div>
		</div>
	{/if}
</div>
