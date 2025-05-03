<script lang="ts">
	import { timelineActions } from '../../stores/timeline/actions';
	import { timelineStore } from '../../stores/timeline/store';

	$: console.log('timelineStore', $timelineStore);
</script>

<div class="flex h-screen flex-col gap-4 bg-gray-900 p-2">
	<p class="py-3 text-xs">Buttons board</p>
	<button
		class="rounded bg-gray-800 p-2 text-xs text-white hover:bg-gray-700"
		on:click={() => timelineActions.addEvent('2', { eventId: '2-4', timestamp: [1690.0, 1790.0] })}
	>
		BUTTON ADD EVENT
	</button>
	<button
		class="rounded bg-gray-800 p-2 text-xs text-white hover:bg-gray-700"
		on:click={() => timelineActions.addAction('15', { tagId: '15-4', timestamp: [1593.0, 1700.6] })}
	>
		BUTTON ADD TAG
	</button>
</div>
