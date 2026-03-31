import { invoke } from '@tauri-apps/api/core';
import type { License, LicenseCommandResponse } from '../types/License';
import { LicenseMapper } from '../mappers/License';

export async function getLicense(): Promise<License> {
	return LicenseMapper.from_command(await invoke<LicenseCommandResponse>('get_license'));
}
