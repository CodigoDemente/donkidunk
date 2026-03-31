export const LICENSE_ACTIVE_EVENT = 'license:active';
export const LICENSE_INACTIVE_EVENT = 'license:inactive';

export type LicenseEvent = {
	subscriptionId: string;
	status: string;
	expiresAt: number;
	features: string[];
};
