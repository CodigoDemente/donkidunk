export type FeedbackType = {
	title?: string;
	message?: string;
	type: 'info' | 'error' | 'success' | 'warning';
	mode: 'auto' | 'manual';
};
export const feedbackMessages: { [key: string]: FeedbackType } = {
	// ERROR MESSAGES
	UNKNOWN_ERROR: {
		title: 'Unknown Error',
		message: 'An unexpected error has occurred.',
		type: 'error',
		mode: 'auto'
	},
	TIMEOUT: {
		title: 'Request Timeout',
		message: 'The request took too long to complete. Please try again.',
		type: 'error',
		mode: 'auto'
	},
	ACTION_FAILED: {
		title: 'Oops! The action could not be completed due to an error.',
		type: 'error',
		mode: 'auto'
	},
	VALIDATION_ERROR: {
		title: 'Validation Error',
		message: 'Please check the input values and try again.',
		type: 'error',
		mode: 'manual'
	},
	// SUCCESS MESSAGES
	ACTION_SUCCESS: {
		title: 'Added successfully!',
		type: 'success',
		mode: 'auto'
	},
	SAVE_SUCCESS: {
		title: 'Project saved successfully!',
		type: 'success',
		mode: 'auto'
	},
	DELETE_SUCCESS: {
		title: 'Deleted successfully!',
		type: 'success',
		mode: 'auto'
	},
	UPDATE_SUCCESS: {
		title: 'Updated successfully!',
		type: 'success',
		mode: 'auto'
	}
};
