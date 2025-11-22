<script lang="ts">
	import { boardContext } from '../board/context.svelte';
	import { timelineContext } from '../videoplayer/context.svelte';
	import { openProject } from '../menu/operations/openProject';
	import { projectActions } from '../../persistence/stores/project/actions';
	import Button from '../../components/button/button.svelte';
	import AddNewProjectModal from '../modalContent/addNewProject/index.svelte';
	import { createNewProject } from '../menu/operations/createProject';

	const board = boardContext.get();
	const timeline = timelineContext.get();

	async function handleSubmit() {
		const formData = projectActions.getNewProjectFormData();

		if (!formData || !formData.projectPath) {
			return;
		}

		await createNewProject(formData.projectPath);

		if (formData.videoPath) {
			await projectActions.setVideoPath(formData.videoPath);
		}

		projectActions.setNewProjectFormData(null);
		projectActions.closeAndResetModal();
	}

	function handleCancel() {
		projectActions.setNewProjectFormData(null);
		projectActions.closeAndResetModal();
	}

	function handleCreateProject() {
		projectActions.setNewProjectFormData(null);
		projectActions.setModal({
			content: AddNewProjectModal,
			title: 'Create New Project',
			onCancel: handleCancel,
			onSubmit: handleSubmit,
			show: true,
			size: 'large'
		});
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
