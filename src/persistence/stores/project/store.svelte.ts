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

const ProjectStore: ProjectData = $state(InitialProjectData);

export default ProjectStore;
