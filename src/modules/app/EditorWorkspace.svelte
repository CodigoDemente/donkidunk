<script lang="ts">
	import Board from '../board/index.svelte';
	import VideoPlayer from '../videoplayer/components/index.svelte';
	import ProjectStore from '../../persistence/stores/project/store.svelte';
	import EmptyProjectState from '../launch/emptyProjectState.svelte';

	let leftWidth = $state(50);
	let isResizing = $state(false);

	const projectStore = ProjectStore.getState();

	function startResize() {
		isResizing = true;
		document.addEventListener('mousemove', resize);
		document.addEventListener('mouseup', stopResize);
	}

	function resize(event: MouseEvent) {
		if (isResizing) {
			const totalWidth = window.innerWidth;
			leftWidth = Math.min(80, Math.max(20, (event.clientX / totalWidth) * 100));
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
