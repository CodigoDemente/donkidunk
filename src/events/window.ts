import { getCurrentWindow } from '@tauri-apps/api/window';
import { closeDatabaseAndSaveChanges } from '../modules/menu/operations/closeProject';
import { LOGGED_IN_EVENT, LOGGED_OUT_EVENT, type LoginEvent } from './types/LoginEvent';
import { listen, type Event } from '@tauri-apps/api/event';
import { appActions } from '../persistence/stores/app/actions';
import {
	LICENSE_ACTIVE_EVENT,
	LICENSE_INACTIVE_EVENT,
	LICENSE_INSUFFICIENT_FEATURES_EVENT,
	type InsufficientFeaturesEvent,
	type LicenseEvent
} from './types/LicenseEvent';
import { LicenseMapper, SubscriptionEntitlementMapper } from '../modules/license/mappers/License';
import { SubscriptionStatus, type License } from '../modules/license/types/License';
import { getLicense } from '../modules/license/commands/GetLicense';
import { showInsufficientFeaturesModal } from '../modules/modalContent/licenseRestrictionModal/showLicenseRestrictionModal';

export class WindowEventHandler {
	private unlisteners: (() => void)[] = [];

	constructor() {}

	async init(): Promise<void> {
		this.unlisteners.push(
			await getCurrentWindow().onCloseRequested(this.onCloseRequested.bind(this))
		);

		this.unlisteners.push(
			await listen<LoginEvent>(LOGGED_IN_EVENT, this.onAuthStateChanged.bind(this))
		);

		this.unlisteners.push(
			await listen<LoginEvent>(LOGGED_OUT_EVENT, this.onAuthStateChanged.bind(this))
		);

		this.unlisteners.push(
			await listen<LicenseEvent>(LICENSE_ACTIVE_EVENT, this.onLicenseEvent.bind(this))
		);

		this.unlisteners.push(
			await listen<LicenseEvent>(LICENSE_INACTIVE_EVENT, this.onLicenseEvent.bind(this))
		);

		this.unlisteners.push(
			await listen<InsufficientFeaturesEvent>(
				LICENSE_INSUFFICIENT_FEATURES_EVENT,
				this.onInsufficientFeaturesEvent.bind(this)
			)
		);
	}

	destroy(): void {
		for (const unlistener of this.unlisteners) {
			unlistener();
		}
		this.unlisteners = [];
	}

	private async onCloseRequested(): Promise<void> {
		await closeDatabaseAndSaveChanges();
	}

	private async onAuthStateChanged(event: Event<LoginEvent>) {
		const isAuthenticated = event.payload.isAuthenticated;

		appActions.setIsAuthenticated(isAuthenticated);

		if (isAuthenticated) {
			appActions.setUnauthenticatedInStartup(false);
			const license = await getLicense();

			this.performLicenseAction(license);
		} else {
			appActions.resetLicense();
		}
	}

	private async onLicenseEvent(event: Event<LicenseEvent>) {
		this.performLicenseAction(LicenseMapper.from_event(event.payload));
	}

	private async onInsufficientFeaturesEvent(event: Event<InsufficientFeaturesEvent>) {
		const entitlement = SubscriptionEntitlementMapper.from_command(event.payload.entitlement);

		showInsufficientFeaturesModal(entitlement);
	}

	private performLicenseAction(license: License) {
		const isLicenseActive = [SubscriptionStatus.Active, SubscriptionStatus.Trialing].includes(
			license.status
		);

		if (isLicenseActive) {
			appActions.setLicenseInactiveInStartup(false);
		}

		appActions.storeLicense(license);
	}
}
