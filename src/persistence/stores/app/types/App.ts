export type AppData = {
	authentication: {
		isAuthenticated: boolean;
		unauthenticatedInStartup: boolean;
	};
	blocker: { title: string; message: string };
	navbarDisabled: boolean;
};
