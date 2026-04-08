<script lang="ts">
	import ProjectStore from '../../persistence/stores/project/store.svelte';
	import '../../styles/page.css';
	import { configContext } from '../config/context.svelte';
	import { onDestroy, onMount, type Snippet } from 'svelte';
	import { getButtonBoardsCommand } from '../config/commands/GetButtonBoards';
	import Modal from '../../components/modal/modal.svelte';
	import Snackbar from '../../components/snackbar/snackbar.svelte';
	import { Board as BoardContext, boardContext } from '../board/context.svelte';
	import { Timeline, timelineContext } from '../videoplayer/context.svelte';
	import { exportActions } from '../../persistence/stores/export/actions';
	import AppStore from '../../persistence/stores/app/store.svelte';
	import { getConfig } from '../config/commands/GetConfig';
	import { bindMenuEvents } from '../menu';
	import { destroyEvents, initEvents } from '../../events';

	let { children }: { children: Snippet } = $props();

	const board = boardContext.set(new BoardContext());
	const timeline = timelineContext.set(new Timeline());
	const config = configContext.get();

	board.wrapForUndo();
	timeline.wrapForUndo();

	const projectStore = ProjectStore.getState();
	const appStore = AppStore.getState();

	const isDev = (import.meta as unknown as { env: { DEV: boolean } }).env.DEV;

	$effect(() => {
		appStore.navbarDisabled =
			!projectStore.file?.originalPath ||
			exportActions.getExporting() ||
			timeline.eventsPlaying.size > 0;
	});

	onMount(async () => {
		const configData = await getConfig();
		config.state = configData;

		if (!isDev) {
			document.addEventListener('contextmenu', (event) => {
				event.preventDefault();
			});
		}

		await bindMenuEvents(board, timeline, config);
		await initEvents();

		try {
			config.buttonBoards = await getButtonBoardsCommand();
		} catch (e) {
			console.error(e);
		}
	});

	onDestroy(destroyEvents);
</script>

<div class="flex h-full min-h-0 w-full flex-1 flex-col">
	{@render children()}
</div>

<Modal bind:modalStore={projectStore.modal} />
<Snackbar bind:snackbarStore={projectStore.snackbar} />
