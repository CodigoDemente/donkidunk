<script lang="ts">
	import Button from '../../components/button/button.svelte';
	import donkidunkLogo from '../../styles/donkidunk_logo.png';
	import { startOAuthFlow } from '../login/commands/StartOAuthFlow';
	import { openUrl } from '@tauri-apps/plugin-opener';

	const DEFAULT_LICENSE_TITLE = 'Subscription inactive';
	const DEFAULT_LICENSE_MESSAGE =
		'Your subscription is paused or expired. Renew to keep using Donkidunk with full access.';
	const DEFAULT_RENEW_URL = 'https://donkidunk.com';

	type BlockerProps = {
		variant?: 'session' | 'license';
		title?: string;
		message?: string;
		/** Used when variant is license; defaults to donkidunk.com */
		renewUrl?: string;
		showLoginButton?: boolean;
	};

	let {
		variant = 'session',
		title,
		message,
		renewUrl: renewUrlProp,
		showLoginButton = true
	}: BlockerProps = $props();

	const isLicense = $derived(variant === 'license');

	const licenseTitle = $derived(title ?? DEFAULT_LICENSE_TITLE);
	const licenseMessage = $derived(message ?? DEFAULT_LICENSE_MESSAGE);
	const renewUrl = $derived(renewUrlProp ?? DEFAULT_RENEW_URL);

	const titleId = $derived(isLicense ? 'license-blocker-title' : 'blocker-title');
	const messageId = $derived(isLicense ? 'license-blocker-message' : 'blocker-message');

	let sessionLoading = $state(false);
	let licenseRenewPending = $state(false);

	async function handleLogin() {
		sessionLoading = true;
		try {
			const returnUrl = await startOAuthFlow();
			await openUrl(returnUrl);
		} finally {
			sessionLoading = false;
		}
	}

	async function handleRenewLicense() {
		licenseRenewPending = true;
		await openUrl(renewUrl);
	}
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-md"
	role="alertdialog"
	aria-modal="true"
	aria-labelledby={titleId}
	aria-describedby={messageId}
>
	<img
		src={donkidunkLogo}
		alt=""
		class="pointer-events-none absolute top-1/2 left-1/2 h-3/5 w-3/5 -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.03] grayscale"
	/>

	<div
		class="relative mx-4 flex w-full max-w-sm flex-col items-center gap-6 rounded-xl border border-gray-700/50 bg-gray-800/90 px-8 py-10 shadow-2xl"
	>
		{#if isLicense}
			<div
				class="border-primary/35 bg-primary/10 flex h-14 w-14 items-center justify-center rounded-full border"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="text-primary h-7 w-7"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
					/>
				</svg>
			</div>
		{:else}
			<div
				class="flex h-14 w-14 items-center justify-center rounded-full border border-yellow-600/30 bg-yellow-900/20"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-7 w-7 text-yellow-500"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
					/>
				</svg>
			</div>
		{/if}

		<div class="flex flex-col items-center gap-2">
			<h2 id={titleId} class="text-center text-lg font-semibold text-gray-100">
				{#if isLicense}
					{licenseTitle}
				{:else}
					{title ?? ''}
				{/if}
			</h2>
			<p id={messageId} class="text-center text-sm leading-relaxed text-gray-400">
				{#if isLicense}
					{licenseMessage}
				{:else}
					{message ?? ''}
				{/if}
			</p>
		</div>

		<div class="flex w-full flex-col items-center gap-3 pt-2">
			{#if isLicense}
				{#if licenseRenewPending}
					<div class="flex flex-col items-center gap-4 py-3" aria-live="polite">
						<svg
							class="text-primary h-11 w-11 animate-spin"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							aria-hidden="true"
						>
							<circle
								class="opacity-25"
								cx="12"
								cy="12"
								r="10"
								stroke="currentColor"
								stroke-width="4"
							></circle>
							<path
								class="opacity-90"
								fill="currentColor"
								d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
							></path>
						</svg>
						<p class="max-w-[260px] text-center text-sm leading-relaxed text-gray-400">
							Complete renewal in your browser. This screen will update when your subscription is
							active again.
						</p>
					</div>
				{:else}
					<Button size="fluid" primary onClick={handleRenewLicense}>Renew subscription</Button>
				{/if}
			{:else if showLoginButton}
				<Button size="fluid" primary onClick={handleLogin} disabled={sessionLoading}>
					{sessionLoading ? 'Opening browser...' : 'Log in'}
				</Button>
			{/if}
		</div>

		<div class="border-t border-gray-700/50 pt-4">
			<a
				href="https://donkidunk.com"
				target="_blank"
				rel="noopener noreferrer"
				class="text-tertiary hover:text-tertiary-light inline-flex items-center gap-1.5 text-xs transition-colors"
			>
				<span>donkidunk.com</span>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-3 w-3"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="2"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
					/>
				</svg>
			</a>
		</div>
	</div>
</div>
