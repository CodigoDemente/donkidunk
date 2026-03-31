import { SvelteDate } from 'svelte/reactivity';
import {
	SubscriptionEntitlement,
	SubscriptionStatus,
	type License,
	type LicenseCommandResponse
} from '../types/License';
import type { LicenseEvent } from '../../../events/types/LicenseEvent';

export class SubscriptionStatusMapper {
	static from_command(status: string): SubscriptionStatus {
		switch (status) {
			case 'active':
				return SubscriptionStatus.Active;
			case 'inactive':
				return SubscriptionStatus.Inactive;
			case 'paused':
				return SubscriptionStatus.Paused;
			case 'trialing':
				return SubscriptionStatus.Trialing;
			default:
				return SubscriptionStatus.Inactive;
		}
	}
}

export class SubscriptionEntitlementMapper {
	static from_command(entitlement: string): SubscriptionEntitlement {
		switch (entitlement) {
			case 'text_on_export':
				return SubscriptionEntitlement.TextOnExport;
			case 'save_button_board':
				return SubscriptionEntitlement.SaveButtonBoard;
			case 'view_preset_proboard':
				return SubscriptionEntitlement.ViewPresetProboard;
			case 'tags_view':
				return SubscriptionEntitlement.TagsView;
			case 'clip_gallery':
				return SubscriptionEntitlement.ClipGallery;
			case 'metrics_export':
				return SubscriptionEntitlement.MetricsExport;
			default:
				return SubscriptionEntitlement.Unknown;
		}
	}
}

export class LicenseMapper {
	static from_command(license: LicenseCommandResponse): License {
		return {
			id: license.id,
			status: SubscriptionStatusMapper.from_command(license.status),
			expiresAt: new SvelteDate(license.expires_at),
			features: license.features.map(SubscriptionEntitlementMapper.from_command)
		};
	}

	static from_event(license: LicenseEvent): License {
		return {
			id: license.subscriptionId,
			status: SubscriptionStatusMapper.from_command(license.status),
			expiresAt: new SvelteDate(license.expiresAt),
			features: license.features.map(SubscriptionEntitlementMapper.from_command)
		};
	}
}
