import { makeStoreProxy, StoreScope } from '..';
import type { ProjectData } from './types/Project';

const ProjectStore: ProjectData = $state({
	metadata: {
		timestamp: ''
	},
	file: {
		newlyCreated: false,
		path: ''
	},
	video: {
		path: ''
	},
	database: null
});

export default makeStoreProxy(ProjectStore, StoreScope.PROJECT);
