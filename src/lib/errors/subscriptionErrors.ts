export class SubscriptionInactive extends Error {
	constructor(message?: string, options?: ErrorOptions) {
		super(message || 'Subscription inactive', options);
	}
}
