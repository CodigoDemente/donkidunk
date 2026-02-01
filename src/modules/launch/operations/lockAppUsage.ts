import { projectActions } from '../../../persistence/stores/project/actions';
import appDeactivatedModal from '../../modalContent/appDeactivatedModal/index.svelte';

export function lockAppUsage() {
	projectActions.setModal({
		content: appDeactivatedModal,
		title: 'App Deactivated',
		onCancel: () => false,
		onSubmit: () => false,
		show: true,
		dismissible: false,
		size: 'large'
	});
}
