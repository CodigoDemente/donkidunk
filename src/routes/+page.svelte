<script lang="ts">
	import '../styles/page.css';
	import VideoPlayer from '../modules/videoplayer/index.svelte';
	import Board from '../modules/board/index.svelte';
	import ProjectStore from '../stores/project.svelte';
</script>

<div class="flex w-full flex-row gap-3">
	<div class="w-1/2">
		<VideoPlayer video={ProjectStore.getProject().video?.path} />
	</div>
	<div class="w-1/2">
		<Board />
	</div>
</div>
