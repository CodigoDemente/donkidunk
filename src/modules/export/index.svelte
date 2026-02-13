<script lang="ts">
	import ProjectStore from '../../persistence/stores/project/store.svelte';
	import { boardContext } from '../../modules/board/context.svelte';
	import { timelineContext } from '../../modules/videoplayer/context.svelte';
	import { TimelineRepositoryFactory } from '../../factories/TimelineRepositoryFactory';
	import { exportActions } from '../../persistence/stores/export/actions';
	import Button from '../../components/button/button.svelte';
	import { ExportContext } from './context.svelte';
	import { exportVideo } from './operations/exportVideo';
	import ExportRulesTable from './components/ExportRulesTable.svelte';
	import ExportRuleForm from './components/ExportRuleForm.svelte';
	import ExportProgress from './components/ExportProgress.svelte';

	const board = boardContext.get();
	const timeline = timelineContext.get();
	const timelineRepository = TimelineRepositoryFactory.getInstance();
	const projectStore = ProjectStore.getState();

	const context = new ExportContext(board, timeline);

	async function onExport() {
		await exportVideo(projectStore.video.path!, context.rules, timelineRepository);
	}
</script>

<div class="flex h-full w-full flex-col gap-1 p-4">
	<h2 class="text-lg font-bold">Export your video</h2>
	<div class="flex w-full border-b border-gray-300" role="separator"></div>

	<!-- Main content area -->
	<div class="flex-1 overflow-y-auto">
		<ExportRulesTable {context} />
	</div>

	<!-- Form always visible at the bottom -->
	<ExportRuleForm {context} />

	<Button
		customClass="self-center my-8"
		primary
		size="large"
		onClick={onExport}
		disabled={context.rules.length === 0 || exportActions.getExporting()}>Export Video</Button
	>

	<ExportProgress />
</div>
