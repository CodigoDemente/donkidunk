<script lang="ts">
	interface Props {
		start: number;
		end: number | null;
		timelineStart: number;
		timelineEnd: number;
		isSelected?: boolean;
		color: string;
		borderColor?: string;
		name: string;
		onClick: () => void;
	}

	let {
		start,
		end,
		timelineStart,
		timelineEnd,
		isSelected,
		color,
		borderColor,
		name,
		onClick
	}: Props = $props();

	let total = $derived(timelineEnd - timelineStart);

	// Posición relativa al rango visible del timeline
	let relativeStart = $derived(Math.max(0, start - timelineStart));
	let relativeEnd = $derived(Math.min(timelineEnd, end || timelineEnd) - timelineStart);

	// Calcular el ancho y posición en porcentaje
	let leftPercentage = $derived(relativeStart / total);
	let widthPercentage = $derived((relativeEnd - relativeStart) / total);
</script>

<div
	class={`border-rounded-xs absolute h-full rounded-xs border-2 opacity-80 hover:opacity-100 ${isSelected ? 'opacity-100' : ''}`}
	style="left: {leftPercentage * 100}%; width: {widthPercentage *
		100}%; background-color: {color}; border-color: {borderColor || color};"
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
