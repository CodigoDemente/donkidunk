import type { ClientInit, HandleClientError } from '@sveltejs/kit';
import {
	installGlobalErrorHandlers,
	logPipelineFailure,
	registerDefaultClientErrorReporter,
	reportKitClientError
} from '$lib/errors/globalClientErrors';

/**
 * One-time client bootstrap: global listeners + default reporter.
 * Failures inside `onMount(async ...)` that SvelteKit/Svelte swallow never hit `window`;
 * use `reportCaughtClientError` in a root layout `try/catch` when needed.
 */
export const init: ClientInit = () => {
	installGlobalErrorHandlers();
	registerDefaultClientErrorReporter();
};

export const handleError: HandleClientError = ({ error, event, status, message }) => {
	try {
		reportKitClientError({
			error,
			routeId: event.route.id,
			url: event.url.href,
			status,
			kitMessage: message
		});
	} catch (err) {
		logPipelineFailure('handleError', err);
	}
};
