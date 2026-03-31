import type { License } from '../../../../modules/license/types/License';

export type AppData = {
	authentication: {
		isAuthenticated: boolean;
		unauthenticatedInStartup: boolean;
	};
	subscription: License & {
		inactiveInStartup: boolean;
	};
	blocker: { title: string; message: string };
	errorInStartup: boolean;
	navbarDisabled: boolean;
};
