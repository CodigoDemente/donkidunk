import type { ProjectData } from './types/Project';

export const InitialProjectData: ProjectData = {
	metadata: {
		timestamp: '',
		backupId: '',
		dirty: false
	},
	file: {
		currentPath: '',
		originalPath: ''
	},
	video: {
		path: ''
	},
	modal: {
		content: null,
		title: undefined,
		onCancel: undefined,
		onSubmit: undefined,
		show: false,
		size: undefined
	},
	snackbar: {
		title: '',
		message: '',
		type: 'info',
		show: false,
		mode: 'auto'
	},
	database: null,
	newProjectFormData: null
};

let projectStore: ProjectData = $state(InitialProjectData);

export default class ProjectStore {
	static getState(): ProjectData {
		return projectStore;
	}

	static setState(newState: ProjectData) {
		projectStore = newState;
	}

	static reset() {
		projectStore = InitialProjectData;
	}
}
