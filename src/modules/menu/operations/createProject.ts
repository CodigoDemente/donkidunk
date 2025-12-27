import { projectActions } from '../../../persistence/stores/project/actions';
import type { Board } from '../../board/context.svelte';
import type { Config } from '../../config/context.svelte';
import { createNewProject as createNewProjectModal } from '../../modalContent/addNewProject/createProject';
import AddNewProjectModal from '../../modalContent/addNewProject/index.svelte';

export async function createNewProject(board: Board, config: Config) {
	projectActions.setNewProjectFormData(null);
	projectActions.setModal({
		content: AddNewProjectModal,
		title: 'Create New Project',
		onCancel: handleCancel,
		onSubmit: () => handleSubmit(board, config),
		onSubmitText: 'Create',
		show: true,
		size: 'large'
	});
}

async function handleSubmit(board: Board, config: Config) {
	const formData = projectActions.getNewProjectFormData();

	if (!formData || !formData.projectPath) {
		return;
	}

	await createNewProjectModal(board, config, formData.buttonBoard, formData.projectPath);

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
