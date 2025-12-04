import { open } from '@tauri-apps/plugin-dialog';

export async function selectVideoFile(): Promise<string | null> {
	const path = await open({
		directory: false,
		multiple: false,
		filters: [
			{
				name: 'Video files',
				extensions: ['mp4']
			}
		]
	});

	if (!path) {
		return null;
	}

	return typeof path === 'string' ? path : path[0];
}
