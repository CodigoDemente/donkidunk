<script lang="ts">
	import BoardStore from '../../persistence/stores/board/store.svelte';
	import Box from '../../components/box/box.svelte';

	export let checkTime;

	const eventCategories = BoardStore.state.eventCategories;
	const actionCategories = BoardStore.state.actionCategories;

	let boxHeight = 50; // Default height percentage for boxes
	let eventsOpen = true;
	let actionsOpen = true;
</script>

<div id="boards-container" class="flex h-full min-h-0 flex-1 flex-col">
	<!-- Events Section -->
	<Box
		categories={eventCategories}
		title="Events board"
		{boxHeight}
		type="eventCategories"
		isOpened={eventsOpen}
		otherIsOpened={actionsOpen}
	/>
	<!-- Actions Section -->
	<Box
		categories={actionCategories}
		title="Actions board"
		{boxHeight}
		type="actionCategories"
		isOpened={actionsOpen}
		otherIsOpened={eventsOpen}
	/>
</div>

<style>
	.rotate-180 {
		transform: rotate(180deg);
	}
</style>
