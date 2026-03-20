<script lang="ts">
	import '../../styles/page.css';
	import donkidunkLogo from '../../styles/donkidunk_logo.png';
	import Button from '../../components/button/button.svelte';
	import { startOAuthFlow } from './commands/StartOAuthFlow';
	import { openUrl } from '@tauri-apps/plugin-opener';

	async function handleLogin() {
		const returnUrl = await startOAuthFlow();

		await openUrl(returnUrl);
	}
</script>

<div class="flex h-full w-full flex-row gap-1">
	<div
		class="relative flex h-full w-full flex-col items-center justify-center gap-8 rounded-lg border border-gray-600 bg-gray-800"
	>
		<img
			src={donkidunkLogo}
			alt="Donkidunk Logo"
			class="absolute top-1/2 left-1/2 h-4/5 w-4/5 -translate-x-1/2 -translate-y-1/2 object-contain opacity-10 grayscale"
		/>
		<p class="relative z-10 text-center text-xl text-gray-200">
			To start using the app you first need to be logged in
		</p>
		<div class="relative z-10 flex items-center gap-4">
			<Button size="extralarge" primary onClick={handleLogin}>Login</Button>
		</div>
	</div>
</div>
