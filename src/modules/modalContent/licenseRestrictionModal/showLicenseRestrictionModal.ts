import { openUrl } from '@tauri-apps/plugin-opener';
import { projectActions } from '../../../persistence/stores/project/actions';
import { getLicenseChangeUrl } from '$lib/config/licensePortalUrl';
import LicenseRestrictionModal from './index.svelte';

export type ShowLicenseRestrictionModalOptions = {
	title?: string;
	message?: string;
	/** Primary button label (footer submit). */
	ctaLabel?: string;
};

const DEFAULT_TITLE = 'Not available on your plan';
const DEFAULT_CTA = 'Upgrade';

export function showLicenseRestrictionModal(options?: ShowLicenseRestrictionModalOptions): void {
	const url = getLicenseChangeUrl();

	projectActions.setModal({
		content: LicenseRestrictionModal,
		contentProps: {
			message: options?.message
		},
		title: options?.title ?? DEFAULT_TITLE,
		onCancel: () => projectActions.closeAndResetModal(),
		onSubmit: async () => {
			await openUrl(url);
			projectActions.closeAndResetModal();
		},
		onSubmitText: options?.ctaLabel ?? DEFAULT_CTA,
		show: true,
		size: 'small',
		dismissible: true
	});
}

export { LicenseRestrictionModal };
