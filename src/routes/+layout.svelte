<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { bindMenuEvents } from '../modules/menu';
	import '../styles/page.css';
	import Navbar from '../modules/navbar/navbar.svelte';
	import { destroyEvents, initEvents } from '../events';
	import { boardContext, Board } from '../modules/board/context.svelte';
	import { Timeline, timelineContext } from '../modules/videoplayer/context.svelte';
	import { Config, configContext } from '../modules/config/context.svelte';
	import { getConfig } from '../modules/config/commands/GetConfig';

	const board = boardContext.set(new Board());
	const timeline = timelineContext.set(new Timeline());
	const config = configContext.set(new Config());

	// Has to be done after creating *both* contexts, since the wrapForUndo method
	// uses the undo manager internally, who accesses both contexts
	board.wrapForUndo();
	timeline.wrapForUndo();

	onMount(async () => {
		// Initialize the menu
		await bindMenuEvents(board, timeline);
		await initEvents();

		const configData = await getConfig();

		config.state = configData;
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

<main class="container">
	<Navbar />
	<slot />
</main>
