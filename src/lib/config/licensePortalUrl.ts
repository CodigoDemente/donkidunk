/** Default when `VITE_LICENSE_CHANGE_URL` is unset or empty. */
const DEFAULT_LICENSE_CHANGE_URL = 'https://donkidunk.com';

/**
 * URL opened when the user chooses to change or upgrade their license.
 * Set `VITE_LICENSE_CHANGE_URL` at build time, or change the default above.
 */
export function getLicenseChangeUrl(): string {
	const fromEnv = import.meta.env.VITE_LICENSE_CHANGE_URL;
	if (typeof fromEnv === 'string' && fromEnv.trim() !== '') {
		return fromEnv.trim();
	}
	return DEFAULT_LICENSE_CHANGE_URL;
}
