import type { ProjectData } from './types/Project';
import { emit } from '@tauri-apps/api/event';

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

const projectStoreHandler = {
	get(target: Record<string, unknown>, property: string, receiver: unknown) {
		if (typeof target[property] === 'object' && target[property] !== null) {
			return new Proxy(target[property], projectStoreHandler);
		} else {
			return Reflect.get(target, property, receiver);
		}
	},

	set(target: Record<string, unknown>, property: string, value: unknown, receiver: unknown) {
		emit('project-changed', {
			property,
			value
		});

		return Reflect.set(target, property, value, receiver);
	},

	deleteProperty(target: Record<string, unknown>, property: string) {
		emit('project-changed', {
			property
		});

		return Reflect.deleteProperty(target, property);
	}
};

export default new Proxy<ProjectData>(ProjectStore, projectStoreHandler);
