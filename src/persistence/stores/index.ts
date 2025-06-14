import { emit } from '@tauri-apps/api/event';

export enum StoreScope {
	PROJECT = 'project',
	BOARD = 'board',
	TIMELINE = 'timeline'
}

export const STORE_CHANGED_EVENT = 'store-changed';

export function makeStoreProxy<T extends Record<string, unknown>>(store: T, scope: StoreScope): T {
	const storeProxyHandler: ProxyHandler<T> = {
		get(target: T, property: string, receiver: unknown) {
			if (typeof target[property] === 'object' && target[property] !== null) {
				return new Proxy(target[property], storeProxyHandler);
			} else {
				return Reflect.get(target, property, receiver);
			}
		},

		set(target: Record<string, unknown>, property: string, value: unknown, receiver: unknown) {
			emit(STORE_CHANGED_EVENT, {
				scope,
				property,
				value
			});

			return Reflect.set(target, property, value, receiver);
		},

		deleteProperty(target: Record<string, unknown>, property: string) {
			emit(STORE_CHANGED_EVENT, {
				scope,
				property
			});

			return Reflect.deleteProperty(target, property);
		}
	};

	return new Proxy<T>(store, storeProxyHandler);
}
