import type { ProjectData } from './types/Project';
import { emit } from '@tauri-apps/api/event';

const ProjectStore: ProjectData = $state({
	file: {
		newlyCreated: false,
		path: ''
	},
	video: {
		path: ''
	},
	database: null
});

const projectStoreHandler = {
	set(target: ProjectData, property: string, value: unknown, receiver: unknown) {
		emit('project-changed', {
			property,
			value
		});

		return Reflect.set(target, property, value, receiver);
	},

	deleteProperty(target: ProjectData, property: string) {
		emit('project-changed', {
			property
		});

		return Reflect.deleteProperty(target, property);
	}
};

export default new Proxy(ProjectStore, projectStoreHandler);
