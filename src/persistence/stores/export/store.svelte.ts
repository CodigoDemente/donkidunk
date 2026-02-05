import type { ExportData } from './types/Export';

export const InitialExportData: ExportData = {
	exporting: false,
	export_progress: 0
};

let exportStore: ExportData = $state(InitialExportData);

export default class ExportStore {
	static getState(): ExportData {
		return exportStore;
	}

	static setState(newState: ExportData) {
		exportStore = newState;
	}

	static reset() {
		Object.assign(exportStore, structuredClone(InitialExportData));
	}
}
