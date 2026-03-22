<script lang="ts">
	import ProjectStore from '../../persistence/stores/project/store.svelte';
	import Button from '../../components/button/button.svelte';
	import ExportRulesTable from './components/ExportRulesTable.svelte';
	import ExportRuleForm from './components/ExportRuleForm.svelte';
	import ExportProgress from './components/ExportProgress.svelte';
	import ExportOrdering from './components/ExportOrdering.svelte';
	import { exportContext } from './context.svelte';
	import { boardContext } from '../board/context.svelte';
	import { timelineContext } from '../videoplayer/context.svelte';
	import { getEventButtonsForExport, getTagsForSelectedButton } from './exportRuleFormOptions';

	const projectStore = ProjectStore.getState();

	const exporting = exportContext.get();
	const board = boardContext.get();
	const timeline = timelineContext.get();

	let step = $state<1 | 2>(1);

	const eventButtons = $derived(getEventButtonsForExport(board.eventButtonsById));

	const tagsForSelectedButton = $derived(
		getTagsForSelectedButton(
			timeline.getState().eventTimeline,
			board.tagsById,
			exporting.newRule.include
		)
	);

	async function onExport() {
		exporting.exportVideo(projectStore.video.path!);
	}
</script>

<div class="flex h-full w-full flex-col gap-1 p-4">
	<h2 class="text-lg font-bold">Export your video</h2>
	<div class="flex w-full border-b border-gray-300" role="separator"></div>

	{#if step === 1}
		<!-- Step 1: Rules -->
		<div class="flex-1 overflow-y-auto">
			<ExportRulesTable
				context={exporting}
				tagsList={board.tagsById}
				buttonsList={board.eventButtonsById}
			/>
		</div>

		<ExportRuleForm
			addRule={() => exporting.addRule()}
			newRule={exporting.newRule}
			{eventButtons}
			{tagsForSelectedButton}
		/>

		<fieldset class="mt-2 flex flex-col gap-1">
			<label class="flex cursor-pointer items-center gap-2 text-sm">
				<input
					type="radio"
					name="export-mode"
					value="rule-order"
					checked={exporting.exportMode === 'rule-order'}
					onchange={() => exporting.setExportMode('rule-order')}
				/>
				Export following the rules order
			</label>
			<label class="flex cursor-pointer items-center gap-2 text-sm">
				<input
					type="radio"
					name="export-mode"
					value="manual"
					checked={exporting.exportMode === 'manual'}
					onchange={() => exporting.setExportMode('manual')}
				/>
				Arrange clips manually before exporting
			</label>
		</fieldset>

		<div class="flex items-center">
			{#if exporting.exportMode === 'rule-order'}
				<Button
					customClass="my-4"
					primary
					size="large"
					onClick={onExport}
					disabled={exporting.rules.length === 0 || exporting.loading}
				>
					Export Video
				</Button>
			{:else}
				<Button
					customClass="my-4"
					primary
					size="large"
					onClick={() => (step = 2)}
					disabled={exporting.rules.length === 0}
				>
					Next
				</Button>
			{/if}
		</div>

		<ExportProgress />
	{:else}
		<!-- Step 2: Ordering -->
		<div class="flex min-h-0 flex-1 flex-col">
			<ExportOrdering videoPath={projectStore.video.path!} />
		</div>

		<div class="shrink-0 pt-2">
			<Button customClass="my-2" size="large" onClick={() => (step = 1)}>Back</Button>
		</div>
	{/if}
</div>
