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
		onDblClick?: () => void;
		onResize?: (start: number, end: number) => void;
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
		onClick,
		onDblClick,
		onResize
	}: Props = $props();

	const total = $derived(timelineEnd - timelineStart);
	const eventEnd = $derived(end || timelineEnd);

	// Calculate position and width
	const relativeStart = $derived(Math.max(0, start - timelineStart));
	const relativeEnd = $derived(Math.min(timelineEnd, eventEnd - timelineStart));
	const leftPercentage = $derived(relativeStart / total);
	const widthPercentage = $derived((relativeEnd - relativeStart) / total);

	// Resize drag state
	let drag = $state<{
		type: 'left' | 'right';
		startX: number;
		startTime: number;
		endTime: number;
		container: HTMLElement;
	} | null>(null);
	let tempStart = $state(start);
	let tempEnd = $state(end || timelineEnd);

	$effect(() => {
		if (!drag) {
			tempStart = start;
			tempEnd = end || timelineEnd;
		}
	});

	function startResize(e: MouseEvent, type: 'left' | 'right') {
		if (!onResize) return;
		e.stopPropagation();
		e.preventDefault();
		const container = (e.currentTarget as HTMLElement).closest('.relative') as HTMLElement;
		if (!container) return;

		drag = {
			type,
			startX: e.clientX,
			startTime: start,
			endTime: end || timelineEnd,
			container
		};
		tempStart = start;
		tempEnd = end || timelineEnd;
		document.addEventListener('mousemove', handleMove);
		document.addEventListener('mouseup', handleUp);
	}

	function handleMove(e: MouseEvent) {
		if (!drag || !onResize) return;
		const deltaX = e.clientX - drag.startX;
		const deltaTime = (deltaX / drag.container.getBoundingClientRect().width) * total;

		if (drag.type === 'left') {
			tempStart = Math.max(timelineStart, Math.min(drag.startTime + deltaTime, drag.endTime - 0.1));
		} else {
			tempEnd = Math.min(timelineEnd, Math.max(drag.startTime + 0.1, drag.endTime + deltaTime));
		}
	}

	function handleUp() {
		if (!drag) return;
		document.removeEventListener('mousemove', handleMove);
		document.removeEventListener('mouseup', handleUp);
		if (onResize && tempStart < tempEnd) {
			onResize(tempStart, tempEnd);
		}
		drag = null;
	}

	$effect(() => () => {
		document.removeEventListener('mousemove', handleMove);
		document.removeEventListener('mouseup', handleUp);
	});

	// Display values during drag
	const displayStart = $derived(drag ? tempStart : start);
	const displayEnd = $derived(drag ? tempEnd : end || timelineEnd);
	const displayLeft = $derived(Math.max(0, displayStart - timelineStart) / total);
	const displayWidth = $derived(
		(Math.min(timelineEnd, displayEnd - timelineStart) -
			Math.max(0, displayStart - timelineStart)) /
			total
	);
</script>

<div
	class={`border-rounded-xs absolute h-full rounded-xs border-2 opacity-80 hover:opacity-100 ${isSelected ? 'opacity-100' : ''}`}
	style="left: {(drag ? displayLeft : leftPercentage) * 100}%; width: {(drag
		? displayWidth
		: widthPercentage) * 100}%; background-color: {color}; border-color: {borderColor || color};"
	aria-label={name}
	title={name}
	role="button"
	tabindex="0"
	onclick={() => !drag && onClick()}
	ondblclick={() => !drag && onDblClick && onDblClick()}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			onClick();
			e.preventDefault();
		}
	}}
>
	{#if onResize}
		<div
			class="pointer-events-auto absolute top-0 left-0 z-20 h-full w-1 cursor-ew-resize"
			role="button"
			tabindex="0"
			onmousedown={(e) => startResize(e, 'left')}
		></div>
		<div
			class="pointer-events-auto absolute top-0 right-0 z-20 h-full w-1 cursor-ew-resize"
			role="button"
			tabindex="0"
			onmousedown={(e) => startResize(e, 'right')}
		></div>
	{/if}
	<!-- Add tooltip padding hover -->
	<div
		class="pointer-events-none absolute inset-0 -m-[5px] hidden border border-transparent group-hover:block"
	></div>
</div>
