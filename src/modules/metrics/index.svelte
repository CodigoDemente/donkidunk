<script lang="ts">
	import { DashboardRepositoryFactory } from '../../factories/DashboardRepositoryFactory';
	import { configContext } from '../config/context.svelte';
	import { UIMode } from '../config/types/Config';
	import { getTextColorForBackground } from '../../components/box/colors';
	import type { EventUsage } from './types/EventUsage';
	import type { TagUsage } from './types/TagUsage';
	import Button from '../../components/button/button.svelte';
	import { save } from '@tauri-apps/plugin-dialog';
	import { path } from '@tauri-apps/api';
	import { join } from '@tauri-apps/api/path';
	import ProjectStore from '../../persistence/stores/project/store.svelte';
	import { exportClipsCSV } from './commands/ExportClipsCSV';
	import { onMount } from 'svelte';

	const config = configContext.get();

	const dashboardRepository = DashboardRepositoryFactory.getInstance();

	let eventsUsed: EventUsage[] = $state([]);
	let tagsUsed: TagUsage[] = $state([]);
	let loading = $state(true);
	let exporting = $state(false);

	const totalEvents = $derived(eventsUsed.reduce((sum, event) => sum + event.count, 0));

	const totalTags = $derived(tagsUsed.reduce((sum, tag) => sum + tag.count, 0));

	const eventsWithUsage = $derived(eventsUsed.filter((event) => event.count > 0));

	const tagsWithUsage = $derived(tagsUsed.filter((tag) => tag.count > 0));

	async function loadMetrics() {
		loading = true;
		try {
			eventsUsed = await dashboardRepository.getEventsUsed();
			if (config.uiMode === UIMode.Advanced) {
				tagsUsed = await dashboardRepository.getTagsUsed();
			}
		} finally {
			loading = false;
		}
	}

	async function onExportHandler() {
		exporting = true;
		try {
			const videoPath = ProjectStore.getState().video.path!;
			const videoDir = await path.dirname(videoPath);

			// Extraer el nombre del archivo sin extensión
			const videoFileName = videoPath.split(/[/\\]/).pop() || 'export';
			const videoNameWithoutExt = videoFileName.replace(/\.[^/.]+$/, '');
			const defaultPath = await join(videoDir, `${videoNameWithoutExt}_export.csv`);

			let outPath = await save({
				title: 'Select output CSV file',
				defaultPath: defaultPath,
				filters: [{ name: 'CSV', extensions: ['csv'] }]
			});

			if (!outPath) {
				return;
			}

			// Añadir extensión .csv si no la tiene
			if (!outPath.toLowerCase().endsWith('.csv')) {
				outPath = `${outPath}.csv`;
			}

			await exportClipsCSV(outPath);
		} finally {
			exporting = false;
		}
	}

	onMount(async () => {
		await loadMetrics();
	});
</script>

<div class="flex h-full w-full flex-col overflow-hidden">
	<div class="flex h-full min-h-0 flex-col gap-4 overflow-hidden p-4">
		<div class="flex h-8 w-full shrink-0 flex-row items-start justify-between">
			<h1 class="shrink-0 text-lg font-bold">Metrics</h1>
			<div class="self-end">
				<Button size="large" primary disabled={exporting} onClick={() => onExportHandler()}
					>Export in CSV</Button
				>
				{#if exporting}
					<p class="mt-2 text-sm text-gray-600">Exporting CSV, please wait...</p>
				{/if}
			</div>
		</div>

		<!-- Summary tables -->
		<div class="flex w-full shrink-0 flex-row gap-3">
			<div>
				<h3 class="text-md font-bold">Total Events</h3>
				<p class="text-sm text-gray-500">{loading ? '...' : totalEvents}</p>
			</div>
			{#if config.uiMode === UIMode.Advanced}
				<div>
					<h3 class="text-md font-bold">Total Tags</h3>
					<p class="text-sm text-gray-500">{loading ? '...' : totalTags}</p>
				</div>
			{/if}
		</div>

		<!-- Detail tables -->
		<div class="flex min-h-0 w-full flex-1 flex-row gap-5 overflow-hidden">
			<!-- Events table -->
			<div class="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
				<h3 class="text-md shrink-0 font-bold">Events Used</h3>
				<div class="rounded-base border-default min-h-0 flex-1 overflow-y-auto border">
					<table class="text-body w-full text-left text-sm rtl:text-right">
						<thead
							class="text-body bg-neutral-secondary-soft rounded-base border-default sticky top-0 border-b text-sm"
						>
							<tr>
								<th scope="col" class="px-6 py-3 text-base font-medium">Event</th>
								<th scope="col" class="px-6 py-3 text-base font-medium">Category</th>
								<th scope="col" class="px-6 py-3 text-base font-medium">Uses</th>
							</tr>
						</thead>
						<tbody>
							{#if loading}
								<tr class="bg-neutral-primary border-default border-b">
									<td colspan="3" class="px-6 py-4 text-center text-gray-500">Loading...</td>
								</tr>
							{:else if eventsWithUsage.length === 0}
								<tr class="bg-neutral-primary border-default border-b">
									<td colspan="3" class="px-6 py-4 text-center text-gray-500"
										>No events have been used</td
									>
								</tr>
							{:else}
								{#each eventsWithUsage as event (event.id)}
									<tr class="bg-neutral-primary border-default border-b">
										<td class="px-6 py-4">
											<span
												class="inline-flex items-center rounded-xl px-2 py-1 text-sm font-medium"
												style={`background-color: ${event.color}; color: ${getTextColorForBackground(event.color)};`}
											>
												{event.name}
											</span>
										</td>
										<td class="px-6 py-4">
											<span
												class="inline-flex items-center rounded-xl px-2 py-1 text-sm font-medium"
												style={`background-color: ${event.category.color}; color: ${getTextColorForBackground(event.category.color)};`}
											>
												{event.category.name}
											</span>
										</td>
										<td class="px-6 py-4">{event.count}</td>
									</tr>
								{/each}
							{/if}
						</tbody>
					</table>
				</div>
			</div>

			{#if config.uiMode === UIMode.Advanced}
				<!-- Tags table -->
				<div class="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
					<h3 class="text-md shrink-0 font-bold">Tags Used</h3>
					<div class="rounded-base border-default min-h-0 flex-1 overflow-y-auto border">
						<table class="text-body w-full text-left text-sm rtl:text-right">
							<thead
								class="text-body bg-neutral-secondary-soft rounded-base border-default sticky top-0 border-b text-sm"
							>
								<tr>
									<th scope="col" class="px-6 py-3 text-base font-medium">Tag</th>
									<th scope="col" class="px-6 py-3 text-base font-medium">Category</th>
									<th scope="col" class="px-6 py-3 text-base font-medium">Uses</th>
								</tr>
							</thead>
							<tbody>
								{#if loading}
									<tr class="bg-neutral-primary border-default border-b">
										<td colspan="3" class="px-6 py-4 text-center text-gray-500">Loading...</td>
									</tr>
								{:else if tagsWithUsage.length === 0}
									<tr class="bg-neutral-primary border-default border-b">
										<td colspan="3" class="px-6 py-4 text-center text-gray-500"
											>No tags have been used</td
										>
									</tr>
								{:else}
									{#each tagsWithUsage as tag (tag.id)}
										<tr class="bg-neutral-primary border-default border-b">
											<td class="px-6 py-4">
												<span
													class="inline-flex items-center rounded-xl px-2 py-1 text-sm font-medium"
													style={`background-color: ${tag.color}; color: ${getTextColorForBackground(tag.color)};`}
												>
													{tag.name}
												</span>
											</td>
											<td class="px-6 py-4">
												<span
													class="inline-flex items-center rounded-xl px-2 py-1 text-sm font-medium"
													style={`background-color: ${tag.category.color}; color: ${getTextColorForBackground(tag.category.color)};`}
												>
													{tag.category.name}
												</span>
											</td>
											<td class="px-6 py-4">{tag.count}</td>
										</tr>
									{/each}
								{/if}
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
