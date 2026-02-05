import ExportStore from './store.svelte';

const exportStore = ExportStore.getState();

export const exportActions = {
	getExporting(): boolean {
		return exportStore.exporting;
	},

	setExporting(exporting: boolean): void {
		exportStore.exporting = exporting;
	},

	getExportProgress(): number {
		return exportStore.export_progress;
	},

	setExportProgress(export_progress: number): void {
		exportStore.export_progress = export_progress;
	}
};
