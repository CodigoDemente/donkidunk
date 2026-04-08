import { SubscriptionEntitlement } from '../../license/types/License';
import { appActions } from '../../../persistence/stores/app/actions';
import {
	showInsufficientFeaturesModal,
	type ShowLicenseRestrictionModalOptions
} from './showLicenseRestrictionModal';
import { debug } from '@tauri-apps/plugin-log';

/** True if the current subscription includes this entitlement (ignores `Unknown` as a requirement). */
export function hasSubscriptionEntitlement(entitlement: SubscriptionEntitlement): boolean {
	return appActions.getLicense().features.includes(entitlement);
}

/**
 * If the user is entitled, returns `true` so the caller can proceed.
 * Otherwise shows the license modal (dismissible) and returns `false` — the action must not run.
 */
export function guardSubscriptionEntitlement(
	entitlement: SubscriptionEntitlement,
	options?: ShowLicenseRestrictionModalOptions
): boolean {
	debug(`Ensuring required entitlement: ${entitlement}`);
	if (hasSubscriptionEntitlement(entitlement)) {
		debug(`Required entitlement: ${entitlement} is available`);
		return true;
	}
	debug(`Insufficient features: ${entitlement}`);
	showInsufficientFeaturesModal(entitlement, options);
	return false;
}
