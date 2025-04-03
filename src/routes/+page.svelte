<script lang="ts">
	import '../styles/page.css';
	import VideoPlayer from '../components/videoplayer/index.svelte';
	import ProjectStore from '../stores/project.svelte';
</script>

<div class="flex flex-row">
	<div class="basis-2/3">
		<VideoPlayer video={ProjectStore.getProject().video?.path} />
	</div>
	<div class="basis-1/3">Test</div>
</div>
