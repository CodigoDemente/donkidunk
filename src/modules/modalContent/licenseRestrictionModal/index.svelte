<script lang="ts">
	type Props = {
		/** Explains why the action is blocked; falls back to a generic message. */
		message?: string;
		/** Matches the primary footer button label (upgrade / billing). */
		primaryCtaLabel?: string;
	};

	let { message, primaryCtaLabel = 'View plans and upgrade' }: Props = $props();

	const body = $derived(
		message?.trim() ||
			'Your current plan does not include this feature. Upgrade to a higher tier to continue.'
	);
</script>

<div class="flex flex-col gap-4 p-4 text-gray-100">
	<p class="text-sm leading-relaxed text-gray-300">
		{body}
	</p>
	<div
		class="rounded-lg border border-amber-500/35 bg-amber-950/45 px-4 py-3 shadow-inner"
		aria-live="polite"
	>
		<p class="text-sm font-semibold tracking-tight text-amber-100">Upgrade in one step</p>
		<p class="mt-1.5 text-xs leading-snug text-amber-100/85">
			Use the green <span class="font-medium text-white">“{primaryCtaLabel}”</span> button below to open
			plan options and switch to a tier that includes this feature. You can also close this dialog with
			Cancel or the × control. Your work is not changed.
		</p>
	</div>
</div>
