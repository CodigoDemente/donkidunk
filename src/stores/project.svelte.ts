import type { ProjectData } from './types/Project';

const project: ProjectData = $state({});

class ProjectStore {
	private project: ProjectData;

	constructor() {
		this.project = project;
	}

	getProject() {
		return this.project;
	}

	setVideoPath(path: string) {
		this.project.video = { path };
	}
}

const projectStore = new ProjectStore();

export default projectStore;
