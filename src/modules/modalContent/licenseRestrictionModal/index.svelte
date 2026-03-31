<script lang="ts">
	type Props = {
		/** Explains why the action is blocked; falls back to a generic message. */
		message?: string;
	};

	let { message }: Props = $props();

	const body = $derived(
		message?.trim() ||
			'Your current plan does not include this feature. Upgrade or change your license to continue.'
	);
</script>

<div class="flex flex-col gap-4 p-4 text-gray-100">
	<p class="text-sm leading-relaxed text-gray-300">
		{body}
	</p>
</div>
