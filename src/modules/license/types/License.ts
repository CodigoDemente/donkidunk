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
	features: string[];
};

export enum SubscriptionStatus {
	Active,
	Inactive,
	Paused,
	Trialing
}
