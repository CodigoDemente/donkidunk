<script lang="ts">
	import type { ModalSize, ProjectData } from '../../persistence/stores/project/types/Project';
	import Button from '../button/button.svelte';

	type Props = {
		modalStore: ProjectData['modal'];
	};

	const { modalStore = $bindable() }: Props = $props();

	let modalElement = $state<HTMLDivElement | undefined>(undefined);

	const sizesToClass = {
		small: 'max-w-md',
		medium: 'max-w-xl',
		large: 'max-w-3xl',
		extralarge: 'max-w-4xl'
	};

	function handleKeyDown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			modalStore?.onCancel?.();
			modalStore.show = false;
		} else if (event.key === 'Enter') {
			modalStore?.onSubmit?.();
		}
	}

	$effect(() => {
		if (modalStore.show && modalElement) {
			setTimeout(() => {
				modalElement?.focus();
			}, 0);
		}
	});
</script>

<!-- !DO NOT USE THIS COMPONENT. This modal is called at the root of the application, then it can be reused throughout the app! -->
<!-- Call projectActions.setModal -->

{#if modalStore.show}
	<!-- Overlay with blur -->
	<div class="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
		<!-- Modal window -->
		<div
			bind:this={modalElement}
			class={`mx-4 flex w-full ${sizesToClass[modalStore.size as ModalSize]} flex-col rounded-lg bg-gray-800 p-0 shadow-lg`}
			onkeydown={handleKeyDown}
			role="dialog"
			aria-modal="true"
			tabindex="0"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-gray-700 px-3 py-1">
				<span class="text-sm text-gray-400">{modalStore.title}</span>
				<button
					class="text-2xl text-gray-400 transition hover:cursor-pointer hover:text-white"
					aria-label="Close"
					onclick={async () => {
						if (modalStore?.onCancel) {
							modalStore.onCancel();
						}
						modalStore.show = false;
					}}
				>
					&times;
				</button>
			</div>
			<!-- Content -->
			<modalStore.content {...modalStore.contentProps} />
			<!-- Footer -->
			<div class="flex justify-end gap-2 border-t border-gray-700 px-4 py-2">
				<Button
					onClick={async () => {
						if (modalStore?.onCancel) {
							modalStore.onCancel();
						}
						modalStore.show = false;
					}}
				>
					Cancel
				</Button>
				<Button
					primary
					onClick={() => {
						if (modalStore?.onSubmit) {
							modalStore.onSubmit();
						}
					}}
				>
					{modalStore.onSubmitText || 'Submit'}
				</Button>
			</div>
		</div>
	</div>
{/if}
