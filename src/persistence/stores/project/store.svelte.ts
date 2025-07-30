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
	database: null
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
