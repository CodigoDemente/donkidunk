<script lang="ts">
	import '../styles/page.css';
	import VideoPlayer from '../modules/videoplayer/index.svelte';
	import ProjectStore from '../stores/project.svelte';
</script>

<div class="flex w-full flex-row">
	<div class="basis-2/3">
		<VideoPlayer video={ProjectStore.getProject().video?.path} />
	</div>
	<div class="basis-1/3">Board</div>
</div>
