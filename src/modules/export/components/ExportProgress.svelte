<script lang="ts">
	import { exportActions } from '../../../persistence/stores/export/actions';
</script>

{#if exportActions.getExporting()}
	<p class="mt-2 text-sm text-gray-600">Exporting video, please wait...</p>

	<div class="w-full rounded-full bg-gray-200 dark:bg-gray-700">
		<div
			class="rounded-full bg-blue-600 p-0.5 text-center text-sm leading-none font-medium text-blue-100
			transition-[width] duration-150 ease-in"
			style="width: {exportActions.getExportProgress()}%"
		>
			{exportActions.getExportProgress()}%
		</div>
	</div>
{/if}
