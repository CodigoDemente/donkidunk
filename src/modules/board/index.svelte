<script lang="ts">
	import Box from '../../components/box/box.svelte';
	import { CategoryType } from '../../components/box/types';
	import { startResize } from '../../components/box/utils';
	import Toggle from '../../components/toggle/toggle.svelte';
	import { saveBoardSizeCommand } from '../config/commands/SaveBoardSize';
	import { configContext } from '../config/context.svelte';
	import { boardContext } from './context.svelte';

	const context = boardContext.get();
	const config = configContext.get();

	let eventsBoxHeight = config.eventsHeight;
	let tagsBoxHeight = config.tagsHeight;
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
		boxHeight={eventsBoxHeight}
		type={CategoryType.Event}
		isOpened={eventsOpen}
		otherIsOpened={tagsOpen}
	/>
	<!-- Resize bar -->
	{#if eventsOpen && tagsOpen}
		<button
			type="button"
			class="h-1 w-full shrink-0 cursor-row-resize border-0 bg-gray-900 p-0"
			onmousedown={() =>
				startResize(
					(h) => (eventsBoxHeight = h),
					(h) => (tagsBoxHeight = h)
				)}
			onmouseup={() => saveBoardSizeCommand(eventsBoxHeight, tagsBoxHeight)}
			aria-label="Resize sections"
			tabindex="0"
		></button>
	{/if}
	<!-- Tags Section -->
	<Box
		categories={context.tagCategories}
		title="Tags"
		boxHeight={tagsBoxHeight}
		type={CategoryType.Tag}
		isOpened={tagsOpen}
		otherIsOpened={eventsOpen}
	/>
</div>
