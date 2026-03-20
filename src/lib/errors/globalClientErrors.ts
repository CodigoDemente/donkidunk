import { error as logError } from '@tauri-apps/plugin-log';

/**
 * Normalized shape for the global client error pipeline. `caught` covers failures inside
 * async callbacks the runtime may absorb without firing `unhandledrejection` (e.g. `onMount`).
 */
export type ClientErrorKind = 'window' | 'unhandledrejection' | 'kit' | 'caught';

export type NormalizedClientError = {
	kind: ClientErrorKind;
	message: string;
	context?: string;
	stack?: string;
	cause?: unknown;
	routeId?: string | null;
	url?: string;
	/** Only when `kind === 'kit'`: HTTP status from the navigation failure. */
	status?: number;
	/** Only when `kind === 'kit'`: message surfaced by SvelteKit. */
	kitMessage?: string;
};

export type ClientErrorReporter = (e: NormalizedClientError) => void;

const reporters: ClientErrorReporter[] = [];

let handlersInstalled = false;
let defaultReporterRegistered = false;

/**
 * Last-resort logging when the pipeline itself fails. Does not call reporters (avoids loops).
 */
export function logPipelineFailure(context: string, err: unknown): void {
	const detail =
		err instanceof Error ? err.stack?.trim() || err.message || String(err) : String(err);
	const msg = `[global:pipelineFailure] ${context}: ${detail}`;
	if (import.meta.env.DEV) {
		console.error(msg, err);
	}
	void logError(msg).catch(() => {
		console.error(msg);
	});
}

export function registerClientErrorReporter(fn: ClientErrorReporter): () => void {
	reporters.push(fn);
	return () => {
		const i = reporters.indexOf(fn);
		if (i >= 0) reporters.splice(i, 1);
	};
}

export function reportNormalizedError(payload: NormalizedClientError): void {
	for (let i = 0; i < reporters.length; i++) {
		const r = reporters[i];
		try {
			r(payload);
		} catch (reporterErr) {
			logPipelineFailure(`reporter[${i}]`, reporterErr);
		}
	}
}

/** Explicitly caught errors (e.g. `try/catch` in root `onMount`). */
export function reportCaughtClientError(
	error: unknown,
	extra?: Partial<NormalizedClientError>
): void {
	const n = normalizeUnknownError(error);
	reportNormalizedError({
		kind: 'caught',
		message: n.message,
		stack: n.stack,
		cause: n.cause,
		...extra
	});
}

export function normalizeUnknownError(reason: unknown): {
	message: string;
	stack?: string;
	cause?: unknown;
} {
	if (reason instanceof Error) {
		return {
			message: reason.message || String(reason),
			stack: reason.stack,
			cause: reason.cause
		};
	}
	if (typeof reason === 'string') {
		return { message: reason };
	}
	try {
		return { message: JSON.stringify(reason), cause: reason };
	} catch {
		return { message: String(reason), cause: reason };
	}
}

function formatLogLine(e: NormalizedClientError): string {
	const parts = [`[global:${e.kind}]`, e.message];
	if (e.stack) parts.push(e.stack);
	if (e.routeId != null) parts.push(`routeId=${String(e.routeId)}`);
	if (e.url) parts.push(`url=${e.url}`);
	if (e.status != null) parts.push(`status=${String(e.status)}`);
	if (e.kitMessage) parts.push(`kitMessage=${e.kitMessage}`);
	return parts.join('\n');
}

function defaultLoggingReporter(e: NormalizedClientError): void {
	const line = formatLogLine(e);
	if (import.meta.env.DEV) {
		console.error(`[global:${e.kind}]`, e.message, {
			stack: e.stack,
			routeId: e.routeId,
			url: e.url,
			status: e.status,
			kitMessage: e.kitMessage,
			cause: e.cause
		});
	}
	void logError(line).catch(() => {
		console.error('[global:tauri-log-failed]', line);
	});
}

/** Idempotent: registers the default reporter (dev console + Tauri log on every report). */
export function registerDefaultClientErrorReporter(): void {
	if (defaultReporterRegistered) return;
	defaultReporterRegistered = true;
	registerClientErrorReporter(defaultLoggingReporter);
}

function onWindowError(event: ErrorEvent): void {
	const normalized =
		event.error !== undefined && event.error !== null
			? normalizeUnknownError(event.error)
			: { message: event.message || 'Unknown script error', stack: undefined };

	reportNormalizedError({
		kind: 'window',
		message: normalized.message,
		stack: normalized.stack,
		cause: normalized.cause
	});
}

function onUnhandledRejection(event: PromiseRejectionEvent): void {
	const normalized = normalizeUnknownError(event.reason);
	reportNormalizedError({
		kind: 'unhandledrejection',
		message: normalized.message,
		stack: normalized.stack,
		cause: normalized.cause
	});
}

/** Registers `error` (capture) and `unhandledrejection` on `window`. Idempotent. */
export function installGlobalErrorHandlers(): void {
	if (handlersInstalled) return;
	handlersInstalled = true;
	window.addEventListener('error', onWindowError, true);
	window.addEventListener('unhandledrejection', onUnhandledRejection);
}

export function reportKitClientError(input: {
	error: unknown;
	routeId: string | null;
	url: string;
	status: number;
	kitMessage: string;
}): void {
	const n = normalizeUnknownError(input.error);
	reportNormalizedError({
		kind: 'kit',
		message: n.message,
		stack: n.stack,
		cause: n.cause,
		routeId: input.routeId,
		url: input.url,
		status: input.status,
		kitMessage: input.kitMessage
	});
}
