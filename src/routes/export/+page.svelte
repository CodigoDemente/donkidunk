<script lang="ts">
	import { Channel, invoke } from '@tauri-apps/api/core';
	import ProjectStore from '../../persistence/stores/project/store.svelte';
	import { boardContext } from '../../modules/board/context.svelte';
	import { getTextColorForBackground } from '../../components/box/colors';
	import { TimelineRepositoryFactory } from '../../factories/TimelineRepositoryFactory';
	import { save } from '@tauri-apps/plugin-dialog';
	import { path } from '@tauri-apps/api';
	import type { ExportEvent } from '../../events/types/ExportEvent';
	import { debug } from '@tauri-apps/plugin-log';

	const board = boardContext.get();

	const timelineRepository = TimelineRepositoryFactory.getInstance();

	const selectedEvents: number[] = $state([]);
	const selectedTags: number[] = $state([]);

	const projectStore = ProjectStore.getState();
	let exporting = $state(false);
	let export_progress = $state(0);

	async function export_video(): Promise<void> {
		// Fix initial values just in case
		exporting = false;
		export_progress = 0;

		const inVideoExtension = projectStore.video.path!.split('.').pop();
		const inVideoFolder = await path.dirname(projectStore.video.path!);

		const outPath = await save({
			title: 'Select output video file',
			defaultPath: inVideoFolder,
			filters: [{ name: 'Video', extensions: [inVideoExtension!] }]
		});

		if (!outPath) {
			return;
		}

		exporting = true;

		const ranges = await timelineRepository.getRangesForExport(selectedEvents, [], selectedTags);

		const onEvent = new Channel<ExportEvent>();
		onEvent.onmessage = (message) => {
			const progress = message.progress;
			debug(`Exporting progress: ${message.progress}`);
			export_progress = Math.trunc(progress * 100);
		};

		await invoke('cut_video', {
			videoPath: projectStore.video.path,
			outPath,
			ranges,
			onEvent
		});

		exporting = false;
	}
</script>

<div class="flex w-full flex-col gap-1 p-4">
	<h2 class="text-lg font-bold">Export your video</h2>
	<div class="flex w-full border-b border-gray-300" role="separator"></div>
	<h3>Events</h3>
	<div class="flex w-full flex-row gap-2">
		{#each board.eventCategories as category (category.id)}
			{#each category.buttons as button (button.id)}
				<button
					class="cursor-pointer rounded px-4 py-2 disabled:opacity-50"
					style="background-color: {category.color}; color: {getTextColorForBackground(
						category.color
					)}"
					onclick={() => {
						if (selectedEvents.includes(button.id)) {
							const index = selectedEvents.indexOf(button.id);
							if (index > -1) {
								selectedEvents.splice(index, 1);
							}
						} else {
							selectedEvents.push(button.id);
						}
					}}
					class:disabled={!selectedEvents.includes(button.id)}
				>
					{button.name}
				</button>
			{/each}
		{/each}
	</div>
	<div class="flex w-full border-b border-gray-300" role="separator"></div>
	<h3>Tags</h3>
	<div class="flex w-full flex-row gap-2">
		{#each Object.entries(board.tagsById) as [id, tag] (id)}
			<button
				class="cursor-pointer rounded px-4 py-2 disabled:opacity-50"
				style="background-color: {tag.color}; color: {getTextColorForBackground(tag.color)}"
				onclick={() => {
					if (selectedTags.includes(tag.id)) {
						const index = selectedTags.indexOf(tag.id);
						if (index > -1) {
							selectedTags.splice(index, 1);
						}
					} else {
						selectedTags.push(tag.id);
					}
				}}
				class:disabled={!selectedTags.includes(tag.id)}
			>
				{tag.name}
			</button>
		{/each}
	</div>
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

<style>
	.disabled {
		opacity: 0.5;
	}
</style>
