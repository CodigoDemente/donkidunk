<script lang="ts">
	import '../styles/page.css';
	import VideoPlayer from '../components/videoplayer/index.svelte';
	import ProjectStore from '../stores/project.svelte';
</script>

<VideoPlayer video={ProjectStore.getProject().video?.path} />
