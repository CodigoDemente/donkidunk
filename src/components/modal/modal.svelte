<script lang="ts">
	import Button from '../button/button.svelte';

	export let modalStore;
</script>

<!-- !DO NOT USE THIS COMPONENT. This modal is called at the root of the application, then it can be reused throughout the app! -->
<!-- Call projectActions.setModal -->

{#if modalStore.show}
	<!-- Overlay with blur -->
	<div class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
		<!-- Modal window -->
		<div class="mx-4 flex w-full max-w-xl flex-col rounded-lg bg-gray-800 p-0 shadow-lg">
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-700 px-3 py-1">
				<span class="text-xs text-gray-400">{modalStore.title}</span>
				<button
					class="text-gray-400 transition hover:text-white"
					aria-label="Close"
					on:click={() => {
						modalStore.show = false;
						modalStore.onCancel();
					}}
				>
					&times;
				</button>
			</div>
			<!-- Content -->
			<svelte:component this={modalStore.content} />
			<!-- Footer -->
			<div class="flex justify-end gap-2 border-t border-gray-700 px-4 py-2">
				<button
					class="rounded bg-gray-600 px-4 py-1 text-white transition hover:bg-gray-500"
					on:click={() => {
						modalStore.show = false;
						modalStore.onCancel();
					}}
				>
					Cancel
				</button>
				<Button color="#ffffff" onClick={modalStore.onSubmit}>Submit</Button>
			</div>
		</div>
	</div>
{/if}
