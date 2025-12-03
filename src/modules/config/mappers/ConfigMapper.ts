import type { BackendConfig } from '../types/BackendConfig';
import { Locale, UIMode, type ConfigData } from '../types/Config';

export class ConfigMapper {
	static toConfigData(config: BackendConfig): ConfigData {
		if (!Object.keys(Locale).includes(config.locale.toString())) {
			throw new Error('Invalid locale');
		}

		if (!Object.keys(UIMode).includes(config.ui_mode.toString())) {
			throw new Error('Invalid UI mode');
		}

		return {
			locale: config.locale as Locale,
			uiMode: config.ui_mode as UIMode
		};
	}
}
