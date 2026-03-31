import type { SvelteDate } from 'svelte/reactivity';

export type LicenseCommandResponse = {
	id: string;
	status: string;
	expires_at: number;
	features: string[];
};

export type License = {
	id: string;
	status: SubscriptionStatus;
	expiresAt: SvelteDate;
	features: SubscriptionEntitlement[];
};

export enum SubscriptionStatus {
	Active,
	Inactive,
	Paused,
	Trialing
}

export enum SubscriptionEntitlement {
	TextOnExport = 'text_on_export',
	SaveButtonBoard = 'save_button_board',
	ViewPresetProboard = 'view_preset_proboard',
	TagsView = 'tags_view',
	ClipGallery = 'clip_gallery',
	MetricsExport = 'metrics_export',
	Unknown = 'unknown'
}
