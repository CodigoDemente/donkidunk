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
		show: false
	},
	database: null
};

let projectStore: ProjectData = $state(InitialProjectData);

export default class ProjectStore {
	static get state(): ProjectData {
		return projectStore;
	}

	static set state(newState: ProjectData) {
		projectStore = newState;
	}

	static reset() {
		projectStore = InitialProjectData;
	}
}
