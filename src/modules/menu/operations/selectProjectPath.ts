import { homeDir, join } from '@tauri-apps/api/path';
import { save } from '@tauri-apps/plugin-dialog';

export async function selectProjectPath(): Promise<string | null> {
	try {
		const homePath = await homeDir();
		const defaultPath = await join(homePath, 'project.dnk');

		const path = await save({
			canCreateDirectories: true,
			defaultPath: defaultPath,
			title: 'Save Donkidunk project',
			filters: [
				{
					extensions: ['dnk'],
					name: 'Donkidunk project file'
				}
			]
		});

		if (!path) {
			return null;
		}

		if (!path.endsWith('.dnk')) {
			return `${path}.dnk`;
		}

		return path;
	} catch (error) {
		console.error('Error selecting project path:', error);
		return null;
	}
}
