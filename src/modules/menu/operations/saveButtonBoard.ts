import { projectActions } from '../../../persistence/stores/project/actions';
import type { Board } from '../../board/context.svelte';
import type { Config } from '../../config/context.svelte';
import AddNewButtonBoardModal from '../../modalContent/saveButtonBoard/index.svelte';
import { saveButtonBoard as saveButtonBoardModal } from '../../modalContent/saveButtonBoard/saveButtonBoard';

export async function saveButtonBoard(board: Board, config: Config) {
	config.newButtonBoardFormData = null;
	projectActions.setModal({
		content: AddNewButtonBoardModal,
		title: 'Save Button Board',
		onCancel: () => handleCancel(config),
		onSubmit: () => handleSubmit(board, config),
		show: true,
		size: 'large'
	});
}

function handleCancel(config: Config) {
	config.newButtonBoardFormData = null;
	projectActions.closeAndResetModal();
}

async function handleSubmit(board: Board, config: Config) {
	await saveButtonBoardModal(board, config);
	config.newButtonBoardFormData = null;
	projectActions.closeAndResetModal();
}
