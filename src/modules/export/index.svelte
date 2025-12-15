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
	import Dropdown from '../../components/dropdown/dropdown.svelte';
	import Multiselect from '../../components/multiselect';
	import { cutVideo } from './commands/CutVideo';

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
		label: tag.name
	}));

	const initialRule: ExportingRule = {
		type: CategoryType.Event,
		include: -1,
		taggedWith: [],
		temp: true
	};

	let showForm = $state(false);
	let newRule = $state(initialRule);

	function addRule() {
		if (!showForm) {
			showForm = true;
		}

		newRule.temp = false;
		newRule = initialRule;
		exportingRules = [...exportingRules, { ...newRule }];
		newRule = exportingRules[exportingRules.length - 1];
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

<div class="flex w-full flex-col gap-1 p-4">
	<h2 class="text-lg font-bold">Export your video</h2>
	<div class="flex w-full border-b border-gray-300" role="separator"></div>
	<table>
		<thead>
			<tr>
				<th>Include</th>
				<th>Tagged with</th>
			</tr>
		</thead>
		<tbody>
			{#each exportingRules as rule, idx (idx)}
				{#if !rule.temp}
					<tr>
						<td>{rule.include}</td>
						<td>{rule.taggedWith.join(', ')}</td>
					</tr>
				{/if}
			{/each}
			{#if showForm}
				<tr>
					<td class="p-2">
						<Dropdown
							placeholder="Event"
							options={allEventOptions}
							size="full"
							selectClass="bg-gray-800"
							noErrors
							bind:value={newRule.include}
						/>
					</td>
					<td class="p-2">
						<Multiselect
							options={allTags}
							size="full"
							selectClass="bg-gray-800"
							noErrors
							bind:selectedValues={newRule.taggedWith}
						/>
					</td>
				</tr>
			{/if}
			<tr>
				<td colspan={3} class="p-2 text-center text-gray-300">
					<button class="text-green-400 hover:text-green-600" onclick={addRule}>+</button>
				</td>
			</tr>
		</tbody>
	</table>
	<button
		class="mt-4 rounded bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
		onclick={export_video}
		disabled={exporting}
	>
		Export Video
	</button>
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
