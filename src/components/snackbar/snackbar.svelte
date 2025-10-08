<script lang="ts">
	import { projectActions } from '../../persistence/stores/project/actions';
	import type { ProjectData } from '../../persistence/stores/project/types/Project';

	type Props = {
		snackbarStore: ProjectData['snackbar'];
	};

	let timeout: ReturnType<typeof setTimeout> | null = null;
	const { snackbarStore = $bindable() }: Props = $props();

	$effect(() => {
		if (snackbarStore.show && snackbarStore.mode === 'auto') {
			if (timeout) clearTimeout(timeout);
			timeout = setTimeout(() => projectActions.hideSnackbar(), 3000);
		}
	});

	function close() {
		if (timeout) clearTimeout(timeout);
		projectActions.hideSnackbar();
	}

	// Color palette for backgrounds and text
	const bgColors = {
		error: 'bg-red-200',
		info: 'bg-blue-200',
		success: 'bg-green-200',
		warning: 'bg-yellow-200'
	};
	const textColors = {
		error: 'text-red-800',
		info: 'text-blue-800',
		success: 'text-green-800',
		warning: 'text-yellow-800'
	};
</script>

{#if snackbarStore.show}
	<div
		class={`fixed top-0 left-1/2 z-80 mt-6 flex max-w-[90vw] min-w-[280px] -translate-x-1/2 items-start rounded-sm px-6 py-4
            ${bgColors[snackbarStore.type] ?? 'bg-gray-100'}
            shadow-md
        `}
		style="box-shadow: 0 6px 32px 0 rgba(0,0,0,0.10);"
	>
		<div class="flex flex-1 flex-col gap-1 pr-6">
			{#if snackbarStore.title}
				<p class={`text-base font-semibold ${textColors[snackbarStore.type]}`}>
					{snackbarStore.title}
				</p>
			{/if}
			{#if snackbarStore.message}
				<p class={`text-sm ${textColors[snackbarStore.type]}`}>{snackbarStore.message}</p>
			{/if}
		</div>
		{#if snackbarStore.mode === 'manual'}
			<button
				class="hover:gray-800 absolute top-2 right-3 text-xl font-bold text-gray-500 transition-opacity hover:cursor-pointer"
				onclick={close}
				aria-label="Close"
			>
				&times;
			</button>
		{/if}
	</div>
{/if}
