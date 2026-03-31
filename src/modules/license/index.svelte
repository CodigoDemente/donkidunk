<script lang="ts">
	import '../../styles/page.css';
	import donkidunkLogo from '../../styles/donkidunk_logo.png';
	import Button from '../../components/button/button.svelte';
	import { openUrl } from '@tauri-apps/plugin-opener';

	const RENEW_URL = 'https://donkidunk.com';

	let renewPending = $state(false);

	async function handleCta() {
		renewPending = true;
		await openUrl(RENEW_URL);
	}
</script>

<div class="flex h-full w-full flex-row gap-1">
	<div
		class="relative flex h-full w-full flex-col items-center justify-center gap-8 rounded-lg border border-gray-600 bg-gray-800 px-6"
	>
		<img
			src={donkidunkLogo}
			alt=""
			class="pointer-events-none absolute top-1/2 left-1/2 h-4/5 w-4/5 -translate-x-1/2 -translate-y-1/2 object-contain opacity-10 grayscale"
		/>

		<div
			class="border-primary/35 bg-primary/10 relative z-10 flex h-14 w-14 items-center justify-center rounded-full border"
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="text-primary h-7 w-7"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="1.5"
				aria-hidden="true"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z"
				/>
			</svg>
		</div>

		<div class="relative z-10 flex max-w-md flex-col items-center gap-3 text-center">
			<h1 class="text-xl font-semibold text-gray-100">No valid subscription</h1>
			<p class="text-sm leading-relaxed text-gray-400">
				We couldn’t verify an active license for your account. Renew or check your plan to use
				Donkidunk.
			</p>
		</div>

		<div class="relative z-10 flex flex-col items-center gap-4">
			{#if renewPending}
				<div class="flex flex-col items-center gap-4 py-2" aria-live="polite">
					<svg
						class="text-primary h-11 w-11 animate-spin"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						aria-hidden="true"
					>
						<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
						></circle>
						<path
							class="opacity-90"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					<p class="max-w-[280px] text-center text-sm leading-relaxed text-gray-400">
						Complete renewal in your browser. This screen will update when your subscription is
						active again.
					</p>
				</div>
			{:else}
				<Button size="extralarge" primary onClick={handleCta}>Renew subscription</Button>
			{/if}
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
