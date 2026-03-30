<script lang="ts">
	import ProjectStore from '../../persistence/stores/project/store.svelte';
	import Button from '../../components/button/button.svelte';
	import ExportRulesTable from './components/ExportRulesTable.svelte';
	import ExportRuleForm from './components/ExportRuleForm.svelte';
	import ExportProgress from './components/ExportProgress.svelte';
	import ExportOrdering from './components/ExportOrdering.svelte';
	import { exportContext } from './context.svelte';
	import { boardContext } from '../board/context.svelte';
	import { IconLayoutGrid } from '@tabler/icons-svelte';
	import type { GalleryClip } from './types';

	const projectStore = ProjectStore.getState();

	const exporting = exportContext.get();
	const board = boardContext.get();

	let step = $state<1 | 2>(1);

	const eventButtons = $derived(exporting.eventButtonsForRuleForm);
	const tagsForSelectedButton = $derived(exporting.tagsForSelectedButton);

	async function onExport() {
		await exporting.exportVideo(projectStore.video.path!, step);
	}

	async function onGoToGallery() {
		if (exporting.rules.length === 0 || exporting.loading) return;
		step = 2;
		await exporting.getGalleryClips();
	}

	async function addClipToExportTimeline(clip: GalleryClip) {
		await exporting.addClipToOrder(clip);
	}

	async function removeClipFromTimlime(index: number) {
		await exporting.removeClipFromOrder(index);
	}

	async function reorderClipFromTimeline(fromIdx: number, toIdx: number) {
		await exporting.reorderClip(fromIdx, toIdx);
	}
</script>

<div class="flex h-full w-full flex-col gap-1 p-4 text-gray-200">
	{#if step === 1}
		<p class="text-base text-gray-200">
			First, add rules to choose the sequences you want to export
		</p>
		<!-- Step 1: Rules -->
		<ExportRuleForm
			addRule={() => exporting.addRule()}
			newRule={exporting.newRule}
			{eventButtons}
			{tagsForSelectedButton}
		/>
		<div class="flex-1 overflow-y-auto">
			<ExportRulesTable
				context={exporting}
				tagsList={board.tagsById}
				buttonsList={board.eventButtonsById}
			/>
		</div>

		<div class="mb-4 flex w-full items-end justify-between border-t border-gray-600 pt-4">
			<div class="text-base text-gray-400">
				<p class="font-medium text-gray-300">How do you want to export?</p>
				<p class="mt-1">
					<strong class="text-gray-200">Export video</strong> cuts the source using the
					<strong class="text-gray-200">order of the rules</strong> in the table above.
				</p>
				<p class="">
					Or open the <strong class="text-gray-200">gallery</strong> to preview clips, drag them into
					a custom order, then export from there.
				</p>
			</div>

			<Button
				customClass="my-4"
				primary
				size="large"
				onClick={onExport}
				disabled={exporting.rules.length === 0 || exporting.loading}
			>
				Export video
			</Button>
		</div>

		<div class="flex flex-col py-3">
			<div class="flex w-full items-center justify-center">
				<button
					type="button"
					class="group hover:border-tertiary flex w-full min-w-0 flex-1 cursor-pointer items-start gap-3 rounded-lg border-2 border-gray-500 bg-gray-800/80 p-4 text-left transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 sm:max-w-md"
					onclick={onGoToGallery}
					disabled={exporting.rules.length === 0 || exporting.loading}
					aria-label="Open gallery to arrange clips before exporting"
				>
					<span
						class="text-tertiary flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-gray-700 transition-colors group-hover:bg-gray-600"
					>
						<IconLayoutGrid size={26} stroke={1.5} />
					</span>
					<span class="min-w-0 flex-1">
						<span class="block text-base font-semibold text-gray-100"
							>Gallery &amp; custom order</span
						>
						<span class="mt-0.5 block text-sm text-gray-400">
							Preview clips and arrange the export sequence by hand
						</span>
					</span>
				</button>
			</div>
		</div>

		<ExportProgress />
	{:else}
		<!-- Step 2: Ordering -->
		<div class="flex min-h-0 flex-1 flex-col">
			<ExportOrdering
				loading={exporting.loading}
				removeClipFromOrder={removeClipFromTimlime}
				reorderClip={reorderClipFromTimeline}
				addClipToOrder={addClipToExportTimeline}
				clipsOrdered={exporting.clipsOrdered}
				galleryClips={exporting.galleryClips}
				videoPath={projectStore.video.path!}
			/>
		</div>
		<ExportProgress />
		<div class="flex items-center justify-between">
			<Button customClass="my-4" size="large" onClick={() => (step = 1)}>Back</Button>
			<Button
				customClass="my-4"
				primary
				size="large"
				onClick={onExport}
				disabled={exporting.loading}>Export Video</Button
			>
		</div>
	{/if}
</div>
