import type { StoreScope } from '../../stores';

export type StoreScopeEvent = {
	scope: StoreScope;
	property: string;
	value?: unknown;
};
