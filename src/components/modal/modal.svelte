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
			class={`mx-4 flex max-h-[90vh] w-full ${sizesToClass[modalStore.size as ModalSize]} flex-col rounded-lg bg-gray-800 p-0 shadow-lg`}
			onkeydown={modalStore.dismissible ? handleKeyDown : undefined}
			role="dialog"
			aria-modal="true"
			tabindex="0"
		>
			<!-- Header -->
			<div class="flex shrink-0 items-center justify-between border-b border-gray-700 px-3 py-1">
				<span class="text-sm text-gray-400">{modalStore.title}</span>
				{#if modalStore.dismissible}
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
				{/if}
			</div>
			<!-- Content -->
			<div class="flex min-h-0 flex-1 flex-col overflow-y-auto">
				<modalStore.content {...modalStore.contentProps} />
			</div>
			<!-- Footer -->
			{#if modalStore.dismissible}
				<div class="flex shrink-0 justify-end gap-2 border-t border-gray-700 px-4 py-2">
					<Button
						size="large"
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
						size="large"
						onClick={() => {
							if (modalStore?.onSubmit) {
								modalStore.onSubmit();
							}
						}}
					>
						{modalStore.onSubmitText || 'Submit'}
					</Button>
				</div>
			{/if}
		</div>
	</div>
{/if}
