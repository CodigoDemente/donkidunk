<script lang="ts">
	import ProjectStore from '../../persistence/stores/project/store.svelte';
	import Button from '../../components/button/button.svelte';
	import ExportRulesTable from './components/ExportRulesTable.svelte';
	import ExportRuleForm from './components/ExportRuleForm.svelte';
	import ExportProgress from './components/ExportProgress.svelte';
	import ExportOrdering from './components/ExportOrdering.svelte';
	import { exportContext } from './context.svelte';
	import { boardContext } from '../board/context.svelte';

	const projectStore = ProjectStore.getState();

	const exporting = exportContext.get();
	const board = boardContext.get();

	let step = $state<1 | 2>(1);

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

		<ExportRuleForm context={exporting} />

		<div class="flex items-center justify-between">
			<Button
				customClass="my-4"
				primary
				size="large"
				onClick={onExport}
				disabled={exporting.rules.length === 0 || exporting.loading}
			>
				Export Video
			</Button>

			<Button
				customClass="my-4"
				primary
				size="large"
				onClick={() => (step = 2)}
				disabled={exporting.rules.length === 0}
			>
				Next
			</Button>
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
