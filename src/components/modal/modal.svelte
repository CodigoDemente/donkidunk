<script lang="ts">
	import type { ModalSize } from '../../persistence/stores/project/types/Project';
	import Button from '../button/button.svelte';

	export let modalStore;

	const sizesToClass = {
		small: 'max-w-md',
		medium: 'max-w-xl',
		large: 'max-w-3xl',
		extralarge: 'max-w-4xl'
	};

	const modalSize = sizesToClass[modalStore.size as ModalSize];
</script>

<!-- !DO NOT USE THIS COMPONENT. This modal is called at the root of the application, then it can be reused throughout the app! -->
<!-- Call projectActions.setModal -->

{#if modalStore.show}
	<!-- Overlay with blur -->
	<div class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
		<!-- Modal window -->
		<div
			class={`mx-4 flex w-full ${sizesToClass[modalStore.size as ModalSize]} flex-col rounded-lg bg-gray-800 p-0 shadow-lg`}
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-700 px-3 py-1">
				<span class="text-sm text-gray-400">{modalStore.title}</span>
				<button
					class="text-2xl text-gray-400 transition hover:cursor-pointer hover:text-white"
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
			<svelte:component this={modalStore.content} {...modalStore.contentProps} />
			<!-- Footer -->
			<div class="flex justify-end gap-2 border-t border-gray-700 px-4 py-2">
				<Button
					onClick={() => {
						modalStore.show = false;
						modalStore.onCancel();
					}}
				>
					Cancel
				</Button>
				<Button primary onClick={modalStore.onSubmit}>Submit</Button>
			</div>
		</div>
	</div>
{/if}
