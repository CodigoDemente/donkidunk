<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { bindMenuEvents } from '../modules/menu';
	import '../styles/page.css';
	import Navbar from '../modules/navbar/navbar.svelte';
	import { destroyEvents, initEvents } from '../events';
	import { UndoManagerFactory } from '../persistence/undo/UndoManagerFactory';
	import BoardStore from '../persistence/stores/board/store.svelte';
	import TimelineStore from '../persistence/stores/timeline/store.svelte';
	import { wrapBoardActionsForUndo } from '../persistence/stores/board/actions';

	onMount(async () => {
		// Initialize the menu
		await bindMenuEvents();
		await initEvents();
	});

	onDestroy(() => {
		destroyEvents();
	});

	UndoManagerFactory.createInstance(
		{
			boardStoreGetter: BoardStore.getState,
			boardStoreSetter: BoardStore.setState
		},
		{
			timelineStoreGetter: TimelineStore.getState,
			timelineStoreSetter: TimelineStore.setState
		}
	);

	wrapBoardActionsForUndo();

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
