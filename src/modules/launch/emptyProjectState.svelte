<script lang="ts">
	import { boardContext } from '../board/context.svelte';
	import { timelineContext } from '../videoplayer/context.svelte';
	import { openProject } from '../menu/operations/openProject';
	import Button from '../../components/button/button.svelte';
	import { createNewProject } from '../menu/operations/createProject';

	const board = boardContext.get();
	const timeline = timelineContext.get();

	function handleCreateProject() {
		createNewProject(board);
	}

	async function handleOpenProject() {
		await openProject(board, timeline);
	}
</script>

<div
	class="flex h-full flex-col items-center justify-center gap-12 rounded-lg border border-gray-600 bg-gray-800"
>
	<div class="flex items-center gap-4">
		<Button tertiary onClick={handleCreateProject}>New Project</Button>
		or
		<Button onClick={handleOpenProject}>Open Project</Button>
	</div>
	<p class="w-2/4 text-center text-lg text-gray-400">
		Create a new project or open an existing one to get started
	</p>
</div>
