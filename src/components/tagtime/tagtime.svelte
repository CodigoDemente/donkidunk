<script lang="ts">
	interface Props {
		start: number;
		end: number | null;
		total: number;
		color: string;
		name: string;
		onClick: () => void;
	}

	let { start, end, total, color, name, onClick }: Props = $props();
</script>

<div
	class="absolute h-full rounded-xs opacity-80 hover:opacity-100"
	style="
	left: calc(({start} / {total}) * 100%);
	width: calc(({end} - {start}) / {total} * 100%);
	background-color: {color};"
	aria-label={name}
	title={name}
	role="button"
	tabindex="0"
	onclick={() => onClick()}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			onClick();
			e.preventDefault();
		}
	}}
>
	<!-- Add tooltip padding hover -->
	<div class="absolute inset-0 -m-[5px] hidden border border-transparent group-hover:block"></div>
</div>
