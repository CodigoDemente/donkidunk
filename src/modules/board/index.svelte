<script lang="ts">
	import Box from '../../components/box/box.svelte';
	import { boardContext } from './context.svelte';

	const context = boardContext.get();

	let boxHeight = 50; // Default height percentage for boxes
	let eventsOpen = true;
	let actionsOpen = true;
</script>

<div id="boards-container" class="flex h-full min-h-0 flex-1 flex-col">
	<!-- Events Section -->
	<Box
		categories={context.eventCategories}
		title="Events Board"
		{boxHeight}
		type="eventCategories"
		isOpened={eventsOpen}
		otherIsOpened={actionsOpen}
	/>
	<!-- Actions Section -->
	<Box
		categories={context.actionCategories}
		title="Actions Board"
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
