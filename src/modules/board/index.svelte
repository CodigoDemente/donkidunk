<script lang="ts">
	import BoardStore from '../../persistence/stores/board/store.svelte';
	import Box from '../../components/box/box.svelte';

	let boxHeight = 50; // Default height percentage for boxes
	let eventsOpen = true;
	let actionsOpen = true;
</script>

<div id="boards-container" class="flex h-full min-h-0 flex-1 flex-col">
	<!-- Events Section -->
	<Box
		categories={BoardStore.state.eventCategories}
		title="Events board"
		{boxHeight}
		type="eventCategories"
		isOpened={eventsOpen}
		otherIsOpened={actionsOpen}
	/>
	<!-- Actions Section -->
	<Box
		categories={BoardStore.state.actionCategories}
		title="Actions board"
		{boxHeight}
		type="actionCategories"
		isOpened={actionsOpen}
		otherIsOpened={eventsOpen}
	/>
</div>
