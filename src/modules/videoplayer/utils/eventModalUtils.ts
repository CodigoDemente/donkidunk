/**
 * Event Modal Utilities
 * Helper functions for event-related modals
 */

import { projectActions } from '../../../persistence/stores/project/actions';
import deleteEventModal from '../../modalContent/deleteEventModal/index.svelte';
import type { Timeline } from '../context.svelte';

/**
 * Open delete event confirmation modal
 */
export function openDeleteEventModal(timeline: Timeline, eventId: string): void {
	projectActions.setModal({
		content: deleteEventModal,
		title: 'Delete event',
		onCancel: () => projectActions.closeAndResetModal(),
		onSubmit: async () => {
			await timeline.removeEvent(eventId);
			projectActions.closeAndResetModal();
		},
		onSubmitText: 'Delete',
		show: true,
		size: 'small'
	});
}

export function shouldIgnoreKeyboardEvent(event: KeyboardEvent): boolean {
	const target = event.target;
	return (
		target instanceof HTMLInputElement ||
		target instanceof HTMLTextAreaElement ||
		(target instanceof HTMLElement && target.isContentEditable)
	);
}

/**
 * Check if key is a delete key (Delete or Backspace)
 */
export function isDeleteKey(key: string): boolean {
	return key === 'Delete' || key === 'Backspace';
}
