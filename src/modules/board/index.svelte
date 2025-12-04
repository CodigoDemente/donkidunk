<script lang="ts">
	import Box from '../../components/box/box.svelte';
	import { CategoryType } from '../../components/box/types';
	import Toggle from '../../components/toggle/toggle.svelte';
	import { boardContext } from './context.svelte';

	const context = boardContext.get();

	let boxHeight = 100; // Default height percentage for boxes
	let eventsOpen = true;
	let tagsOpen = true;
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
		title="Events Board"
		{boxHeight}
		type={CategoryType.Event}
		isOpened={eventsOpen}
		otherIsOpened={tagsOpen}
	/>
	<!-- Tags Section -->
	<Box
		categories={context.tagCategories}
		title="Tags"
		{boxHeight}
		type={CategoryType.Tag}
		isOpened={tagsOpen}
		otherIsOpened={eventsOpen}
	/>
</div>
