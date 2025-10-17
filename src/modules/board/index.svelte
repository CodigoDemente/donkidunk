<script lang="ts">
	import Box from '../../components/box/box.svelte';
	import { CategoryType } from '../../components/box/types';
	import Toggle from '../../components/toggle/toggle.svelte';
	import { boardContext } from './context.svelte';

	const context = boardContext.get();

	let boxHeight = 50; // Default height percentage for boxes
	let eventsOpen = true;
	let actionsOpen = true;
</script>

<div id="boards-container" class="flex h-full min-h-0 flex-1 flex-col">
	<Toggle
		labelTruthy="Edit"
		labelFalsy="Play"
		checked={context.isEditing}
		onChange={(value) => context.setEditingMode(value)}
	/>
	<!-- Events Section -->
	<Box
		categories={context.eventCategories}
		tags={context.tagsRelatedToEvents}
		title="Events Board"
		{boxHeight}
		type={CategoryType.Event}
		isOpened={eventsOpen}
		otherIsOpened={actionsOpen}
	/>
	<!-- Actions Section -->
	<Box
		categories={context.actionCategories}
		title="Actions Board"
		{boxHeight}
		type={CategoryType.Action}
		isOpened={actionsOpen}
		otherIsOpened={eventsOpen}
	/>
</div>
