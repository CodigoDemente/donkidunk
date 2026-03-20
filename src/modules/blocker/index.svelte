<script lang="ts">
	import Button from '../../components/button/button.svelte';
	import donkidunkLogo from '../../styles/donkidunk_logo.png';
	import { startOAuthFlow } from '../login/commands/StartOAuthFlow';
	import { openUrl } from '@tauri-apps/plugin-opener';

	type Props = {
		title: string;
		message: string;
	};

	let { title, message }: Props = $props();

	let loading = $state(false);

	async function handleLogin() {
		loading = true;
		try {
			const returnUrl = await startOAuthFlow();
			await openUrl(returnUrl);
		} finally {
			loading = false;
		}
	}
</script>

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/80 backdrop-blur-md"
	role="alertdialog"
	aria-modal="true"
	aria-labelledby="blocker-title"
	aria-describedby="blocker-message"
>
	<img
		src={donkidunkLogo}
		alt=""
		class="pointer-events-none absolute top-1/2 left-1/2 h-3/5 w-3/5 -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.03] grayscale"
	/>

	<div
		class="relative mx-4 flex w-full max-w-sm flex-col items-center gap-6 rounded-xl border border-gray-700/50 bg-gray-800/90 px-8 py-10 shadow-2xl"
	>
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

		<div class="flex flex-col items-center gap-2">
			<h2 id="blocker-title" class="text-center text-lg font-semibold text-gray-100">
				{title}
			</h2>
			<p id="blocker-message" class="text-center text-sm leading-relaxed text-gray-400">
				{message}
			</p>
		</div>

		<div class="flex w-full flex-col items-center gap-3 pt-2">
			<Button size="fluid" primary onClick={handleLogin} disabled={loading}>
				{loading ? 'Opening browser...' : 'Log in'}
			</Button>
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
