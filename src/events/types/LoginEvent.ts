export const LOGGED_IN_EVENT = 'auth:user-logged-in';
export const LOGGED_OUT_EVENT = 'auth:user-logged-out';

export type LoginEvent = {
	isAuthenticated: boolean;
};
