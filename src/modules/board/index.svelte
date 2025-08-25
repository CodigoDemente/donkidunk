<script lang="ts">
	import Box from '../../components/box/box.svelte';
	import { boardContext } from './context.svelte';

	type Props = {
		currentTime: number;
	};

	const { currentTime }: Props = $props();

	const context = boardContext.get();

	let boxHeight = 50; // Default height percentage for boxes
	let eventsOpen = true;
	let actionsOpen = true;

	function addCategory(categoryType: 'eventCategories' | 'actionCategories') {
		return (name: string, color: string) => context.addCategory(categoryType, name, color);
	}

	$inspect(currentTime);
</script>

<div id="boards-container" class="flex h-full min-h-0 flex-1 flex-col">
	<!-- Events Section -->
	<Box
		categories={context.eventCategories}
		title="Events Board"
		{boxHeight}
		type="eventCategories"
		{currentTime}
		isOpened={eventsOpen}
		otherIsOpened={actionsOpen}
		addCategory={addCategory('eventCategories')}
	/>
	<!-- Actions Section -->
	<Box
		categories={context.actionCategories}
		title="Actions Board"
		{boxHeight}
		type="actionCategories"
		{currentTime}
		isOpened={actionsOpen}
		otherIsOpened={eventsOpen}
		addCategory={addCategory('actionCategories')}
	/>
</div>
