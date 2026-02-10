<script lang="ts">
	import Box from '../../components/box/box.svelte';
	import { CategoryType } from '../../components/box/types';
	import { startResize } from '../../components/box/utils';
	import { configContext } from '../config/context.svelte';
	import { UIMode } from '../config/types/Config';
	import { boardContext } from './context.svelte';

	const context = boardContext.get();
	const config = configContext.get();

	let eventsBoxHeight = $derived(config.uiMode === UIMode.Advanced ? config.eventsHeight : 100);
	let tagsBoxHeight = $derived(config.tagsHeight);
	let eventsOpen = true;
	let tagsOpen = true;
</script>

<div id="boards-container" class="flex h-full min-h-0 flex-1 flex-col overflow-y-hidden">
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
	{#if config.uiMode === UIMode.Advanced && eventsOpen && tagsOpen}
		<button
			type="button"
			class="h-1 w-full shrink-0 cursor-row-resize border-0 bg-gray-900 p-0"
			onmousedown={() =>
				startResize(
					(h) => (eventsBoxHeight = h),
					(h) => (tagsBoxHeight = h),
					config
				)}
			aria-label="Resize sections"
			tabindex="0"
		></button>
	{/if}
	{#if config.uiMode === UIMode.Advanced}
		<!-- Tags Section -->
		<Box
			categories={context.tagCategories}
			title="Tags"
			boxHeight={tagsBoxHeight}
			type={CategoryType.Tag}
			isOpened={tagsOpen}
			otherIsOpened={eventsOpen}
		/>
	{/if}
</div>
