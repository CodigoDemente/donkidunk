import { projectActions } from '../../../persistence/stores/project/actions';
import type { Board } from '../../board/context.svelte';
import { createNewProject as createNewProjectModal } from '../../modalContent/addNewProject/createProject';
import AddNewProjectModal from '../../modalContent/addNewProject/index.svelte';

export async function createNewProject(board: Board) {
	projectActions.setNewProjectFormData(null);
	projectActions.setModal({
		content: AddNewProjectModal,
		title: 'Create New Project',
		onCancel: handleCancel,
		onSubmit: () => handleSubmit(board),
		show: true,
		size: 'large'
	});
}

async function handleSubmit(board: Board) {
	const formData = projectActions.getNewProjectFormData();

	if (!formData || !formData.projectPath) {
		return;
	}

	await createNewProjectModal(formData.buttonBoard, board, formData.projectPath);

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
