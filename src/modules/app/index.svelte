<script lang="ts">
	import Board from '../../modules/board/index.svelte';
	import VideoPlayer from '../../modules/videoplayer/components/index.svelte';
	import ProjectStore from '../../persistence/stores/project/store.svelte';
	import '../../styles/page.css';
	import EmptyProjectState from '../../modules/launch/emptyProjectState.svelte';
	import { Config, configContext } from '../../modules/config/context.svelte';
	import { onDestroy, onMount } from 'svelte';
	import { getButtonBoardsCommand } from '../../modules/config/commands/GetButtonBoards';
	import Modal from '../../components/modal/modal.svelte';
	import Snackbar from '../../components/snackbar/snackbar.svelte';
	import { Board as BoardContext, boardContext } from '../board/context.svelte';
	import { Timeline, timelineContext } from '../videoplayer/context.svelte';
	import { exportActions } from '../../persistence/stores/export/actions';
	import AppStore from '../../persistence/stores/app/store.svelte';
	import { getConfig } from '../config/commands/GetConfig';
	import { bindMenuEvents } from '../menu';
	import { destroyEvents, initEvents } from '../../events';

	const board = boardContext.set(new BoardContext());
	const timeline = timelineContext.set(new Timeline());
	const config = configContext.set(new Config());
	// Has to be done after creating *both* contexts, since the wrapForUndo method
	// uses the undo manager internally, who accesses both contexts
	board.wrapForUndo();
	timeline.wrapForUndo();

	let leftWidth = $state(50);
	let isResizing = $state(false);

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

		// Disable default browser context menu in production
		if (!isDev) {
			document.addEventListener('contextmenu', (event) => {
				event.preventDefault();
			});
		}

		// Initialize the menu
		await bindMenuEvents(board, timeline, config);
		await initEvents();

		try {
			config.buttonBoards = await getButtonBoardsCommand();
		} catch (e) {
			console.error(e);
		}
	});

	onDestroy(destroyEvents);

	function startResize() {
		isResizing = true;
		document.addEventListener('mousemove', resize);
		document.addEventListener('mouseup', stopResize);
	}

	function resize(event: MouseEvent) {
		if (isResizing) {
			const totalWidth = window.innerWidth;
			leftWidth = Math.min(80, Math.max(20, (event.clientX / totalWidth) * 100)); // Clamp between 20% and 80%
		}
	}

	function stopResize() {
		isResizing = false;
		document.removeEventListener('mousemove', resize);
		document.removeEventListener('mouseup', stopResize);
	}
</script>

<div class="flex h-full w-full flex-row gap-1">
	{#if projectStore.file?.originalPath}
		<div class="flex h-full shrink-0 flex-col" style="width: {leftWidth}%">
			<VideoPlayer video={projectStore.video?.path} />
		</div>
		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			class="w-1 cursor-col-resize bg-gray-900"
			onmousedown={startResize}
			role="separator"
			aria-orientation="horizontal"
		></div>
		<div class="flex h-full grow flex-col">
			<Board />
		</div>
	{:else}
		<EmptyProjectState />
	{/if}
</div>

<Modal bind:modalStore={projectStore.modal} />
<Snackbar bind:snackbarStore={projectStore.snackbar} />
