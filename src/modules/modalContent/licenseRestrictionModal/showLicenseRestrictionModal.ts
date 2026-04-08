import { openUrl } from '@tauri-apps/plugin-opener';
import { projectActions } from '../../../persistence/stores/project/actions';
import { getLicenseChangeUrl } from '$lib/config/licensePortalUrl';
import LicenseRestrictionModal from './index.svelte';
import { SubscriptionEntitlement } from '../../license/types/License';

export type ShowLicenseRestrictionModalOptions = {
	title?: string;
	message?: string;
	/** Primary button label (footer submit). */
	ctaLabel?: string;
};

const DEFAULT_TITLE = 'Not included in your current plan';
/** Shown as the primary footer action; opens billing / plan change in the browser. */
const DEFAULT_CTA = 'View plans and upgrade';

export function showLicenseRestrictionModal(options?: ShowLicenseRestrictionModalOptions): void {
	const url = getLicenseChangeUrl();
	const primaryCta = options?.ctaLabel ?? DEFAULT_CTA;

	projectActions.setModal({
		content: LicenseRestrictionModal,
		contentProps: {
			message: options?.message,
			primaryCtaLabel: primaryCta
		},
		title: options?.title ?? DEFAULT_TITLE,
		onCancel: () => projectActions.closeAndResetModal(),
		onSubmit: async () => {
			await openUrl(url);
			projectActions.closeAndResetModal();
		},
		onSubmitText: primaryCta,
		show: true,
		size: 'small',
		dismissible: true
	});
}

const ENTITLEMENT_MESSAGES: Partial<Record<SubscriptionEntitlement, string>> = {
	[SubscriptionEntitlement.SaveButtonBoard]:
		'Saving custom button boards is not included in your current plan. Upgrade to keep and reuse your layouts.',
	[SubscriptionEntitlement.MetricsExport]:
		'The Metrics workspace is not included in your current plan. Upgrade to view usage analytics and exports.',
	[SubscriptionEntitlement.TagsView]:
		'Tags view is not included in your current plan. Upgrade to unlock tag-based workflows.',
	[SubscriptionEntitlement.ClipGallery]:
		'The clip gallery is not included in your current plan. Upgrade to access this feature.',
	[SubscriptionEntitlement.ViewPresetProboard]:
		'Professional board presets are not included in your current plan. Upgrade to use them.',
	[SubscriptionEntitlement.TextOnExport]:
		'Text on export is not included in your current plan. Upgrade to enable this option.'
};

const ENTITLEMENT_TITLES: Partial<Record<SubscriptionEntitlement, string>> = {
	[SubscriptionEntitlement.SaveButtonBoard]: 'Save Button Board not in your plan',
	[SubscriptionEntitlement.MetricsExport]: 'Metrics not in your plan',
	[SubscriptionEntitlement.TagsView]: 'Tags not in your plan',
	[SubscriptionEntitlement.ClipGallery]: 'Clip gallery not in your plan',
	[SubscriptionEntitlement.ViewPresetProboard]: 'Pro board presets not in your plan',
	[SubscriptionEntitlement.TextOnExport]: 'Export text option not in your plan'
};

export function showInsufficientFeaturesModal(
	entitlement: SubscriptionEntitlement,
	options?: ShowLicenseRestrictionModalOptions
): void {
	const title = options?.title ?? ENTITLEMENT_TITLES[entitlement];
	const message = options?.message ?? ENTITLEMENT_MESSAGES[entitlement];
	const ctaLabel = options?.ctaLabel ?? DEFAULT_CTA;

	showLicenseRestrictionModal({
		title,
		message,
		ctaLabel
	});
}

export { LicenseRestrictionModal };
