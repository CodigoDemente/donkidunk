<script lang="ts">
	import Board from '../modules/board/index.svelte';
	import VideoPlayer from '../modules/videoplayer/index.svelte';
	import ProjectStore from '../persistence/stores/project/store.svelte';
	import '../styles/page.css';
	import Modal from '../components/modal/modal.svelte';
	import Snackbar from '../components/snackbar/snackbar.svelte';
	import EmptyProjectState from '../modules/launch/emptyProjectState.svelte';

	let leftWidth = 50;
	let isResizing = false;

	const projectStore = ProjectStore.getState();

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

<div class="flex w-full flex-row gap-1">
	<div class="shrink-0" style="width: {leftWidth}%">
		<VideoPlayer video={projectStore.video?.path} />
	</div>
	<div
		class="w-1 cursor-col-resize bg-gray-900"
		onmousedown={startResize}
		role="separator"
		aria-orientation="horizontal"
	></div>
	<div class="grow">
		{#if projectStore.file?.originalPath}
			<Board />
		{:else}
			<EmptyProjectState />
		{/if}
	</div>
</div>
<Modal bind:modalStore={projectStore.modal} />
<Snackbar bind:snackbarStore={projectStore.snackbar} />
