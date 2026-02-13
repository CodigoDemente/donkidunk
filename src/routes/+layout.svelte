<script lang="ts">
	import { onDestroy, onMount, type Snippet } from 'svelte';
	import { bindMenuEvents } from '../modules/menu';
	import '../styles/page.css';
	import Navbar from '../modules/navbar/navbar.svelte';
	import { destroyEvents, initEvents } from '../events';
	import { boardContext, Board } from '../modules/board/context.svelte';
	import { Timeline, timelineContext } from '../modules/videoplayer/context.svelte';
	import { Config, configContext } from '../modules/config/context.svelte';
	import { getConfig } from '../modules/config/commands/GetConfig';
	import ProjectStore from '../persistence/stores/project/store.svelte';
	import { getIsExpiredCommand } from '../modules/launch/commands/getIsExpired';
	import { lockAppUsage } from '../modules/launch/operations/lockAppUsage';
	import { exportActions } from '../persistence/stores/export/actions';

	let { children }: { children: Snippet } = $props();

	const board = boardContext.set(new Board());
	const timeline = timelineContext.set(new Timeline());
	const config = configContext.set(new Config());
	const projectStore = ProjectStore.getState();
	// Has to be done after creating *both* contexts, since the wrapForUndo method
	// uses the undo manager internally, who accesses both contexts
	board.wrapForUndo();
	timeline.wrapForUndo();

	const navbarDisabled = $derived(
		!projectStore.file?.originalPath ||
			exportActions.getExporting() ||
			timeline.eventsPlaying.size > 0
	);

	onMount(async () => {
		const configData = await getConfig();
		config.state = configData;

		// Initialize the menu
		await bindMenuEvents(board, timeline, config);
		await initEvents();

		// Skip license check in dev mode
		if ((import.meta as unknown as { env: { DEV: boolean } }).env.DEV) {
			return;
		}

		const isExpired = await getIsExpiredCommand();

		if (isExpired) {
			lockAppUsage();
		}
	});

	onDestroy(() => {
		destroyEvents();
	});

	document.addEventListener('dragover', (event) => {
		event.preventDefault();
	});
	document.addEventListener('dragenter', (event) => {
		event.preventDefault();
	});
</script>

<main class="container flex h-screen flex-col overflow-hidden">
	<Navbar disabled={navbarDisabled} />
	<div class="flex min-h-0 flex-1 flex-col">
		{@render children()}
	</div>
</main>
