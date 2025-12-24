<script lang="ts">
	import Board from '../modules/board/index.svelte';
	import VideoPlayer from '../modules/videoplayer/index.svelte';
	import ProjectStore from '../persistence/stores/project/store.svelte';
	import '../styles/page.css';
	import Modal from '../components/modal/modal.svelte';
	import Snackbar from '../components/snackbar/snackbar.svelte';
	import EmptyProjectState from '../modules/launch/emptyProjectState.svelte';
	import { configContext } from '../modules/config/context.svelte';
	import { onMount } from 'svelte';
	import { getButtonBoardsCommand } from '../modules/config/commands/GetButtonBoards';

	let leftWidth = 50;
	let isResizing = false;

	const projectStore = ProjectStore.getState();
	const config = configContext.get();

	onMount(() =>
		getButtonBoardsCommand()
			.then((buttonBoards) => {
				config.buttonBoards = buttonBoards;
			})
			.catch((error) => {
				console.error(error);
			})
	);

	function startResize() {
		isResizing = true;
		document.addEventListener('mousemove', resize);
		document.addEventListener('mouseup', stopResize);
	}

	function resize(event: MouseEvent) {
		if (isResizing) {
			const totalWidth = window.innerWidth;
			leftWidth = Math.min(70, Math.max(20, (event.clientX / totalWidth) * 100)); // Clamp between 20% and 80%
		}
	}

	function stopResize() {
		isResizing = false;
		document.removeEventListener('mousemove', resize);
		document.removeEventListener('mouseup', stopResize);
	}
</script>

<div class="flex h-full w-full flex-row gap-1">
	<div class="flex h-full shrink-0 flex-col" style="width: {leftWidth}%">
		<VideoPlayer video={projectStore.video?.path} />
	</div>
	<div
		class="w-1 cursor-col-resize bg-gray-900"
		onmousedown={startResize}
		role="separator"
		aria-orientation="horizontal"
	></div>
	<div class="flex h-full grow flex-col">
		{#if projectStore.file?.originalPath}
			<Board />
		{:else}
			<EmptyProjectState />
		{/if}
	</div>
</div>
<Modal bind:modalStore={projectStore.modal} />
<Snackbar bind:snackbarStore={projectStore.snackbar} />
