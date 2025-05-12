import { EventEmitter } from 'node:events';
import type { ProjectData } from './types/Project';

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

export const StateChangedEmitter = new EventEmitter();

const projectStoreHandler = {
	set(target: ProjectData, property: string, value: unknown, receiver: unknown) {
		StateChangedEmitter.emit('stateChanged', property, value);

		return Reflect.set(target, property, value, receiver);
	},

	deleteProperty(target: ProjectData, property: string) {
		StateChangedEmitter.emit('stateChanged', property, undefined);

		return Reflect.deleteProperty(target, property);
	}
};

export default new Proxy(ProjectStore, projectStoreHandler);
