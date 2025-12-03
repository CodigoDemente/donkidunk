import { invoke } from '@tauri-apps/api/core';
import type { BackendConfig } from '../types/BackendConfig';
import { ConfigMapper } from '../mappers/ConfigMapper';
import type { ConfigData } from '../types/Config';

export async function getConfig(): Promise<ConfigData> {
	const rawConfig = await invoke<BackendConfig>('get_user_config');

	return ConfigMapper.toConfigData(rawConfig);
}
