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

	// Drag state (resize or move)
	let drag = $state<{
		type: 'left' | 'right' | 'move';
		startX: number;
		startTime: number;
		endTime: number;
		duration: number;
		container: HTMLElement;
	} | null>(null);
	let tempStart = $state(start);
	let tempEnd = $state(end || timelineEnd);
	let mouseDownPos = $state({ x: 0, y: 0 });
	let isWaitingForUpdate = $state(false);

	const currentEnd = $derived(end || timelineEnd);

	function propsMatchTemp(): boolean {
		return Math.abs(start - tempStart) < 0.01 && Math.abs(currentEnd - tempEnd) < 0.01;
	}

	function syncTempWithProps() {
		tempStart = start;
		tempEnd = currentEnd;
	}

	$effect(() => {
		if (drag && isWaitingForUpdate && propsMatchTemp()) {
			isWaitingForUpdate = false;
			drag = null;
			syncTempWithProps();
			return;
		}

		if (!drag) {
			if (isWaitingForUpdate && propsMatchTemp()) {
				isWaitingForUpdate = false;
			}
			syncTempWithProps();
		}
	});

	function initDrag(type: 'left' | 'right' | 'move', e: MouseEvent, container: HTMLElement) {
		drag = {
			type,
			startX: e.clientX,
			startTime: start,
			endTime: currentEnd,
			duration: currentEnd - start,
			container
		};
		syncTempWithProps();
		document.addEventListener('mousemove', handleMove);
		document.addEventListener('mouseup', handleUp);
	}

	function startResize(e: MouseEvent, type: 'left' | 'right') {
		if (!onResize) return;
		e.stopPropagation();
		e.preventDefault();
		const container = (e.currentTarget as HTMLElement).closest('.relative') as HTMLElement;
		if (!container) return;
		initDrag(type, e, container);
	}

	function startMove(e: MouseEvent) {
		const target = e.target as HTMLElement;
		if (target.closest('.cursor-ew-resize') || !onResize) return;

		mouseDownPos = { x: e.clientX, y: e.clientY };
		const container = (e.currentTarget as HTMLElement).closest('.relative') as HTMLElement;
		if (!container) return;

		let hasMoved = false;

		function moveHandler(e: MouseEvent) {
			const deltaX = Math.abs(e.clientX - mouseDownPos.x);
			const deltaY = Math.abs(e.clientY - mouseDownPos.y);

			if ((deltaX > 3 || deltaY > 3) && !drag) {
				hasMoved = true;
				document.removeEventListener('mousemove', moveHandler);
				document.removeEventListener('mouseup', upHandler);
				initDrag('move', e, container);
			}
		}

		function upHandler() {
			document.removeEventListener('mousemove', moveHandler);
			document.removeEventListener('mouseup', upHandler);
			if (!hasMoved && !drag) onClick();
		}

		document.addEventListener('mousemove', moveHandler);
		document.addEventListener('mouseup', upHandler);
	}

	function handleMove(e: MouseEvent) {
		if (!drag || !onResize) return;

		const deltaX = e.clientX - drag.startX;
		const deltaTime = (deltaX / drag.container.getBoundingClientRect().width) * total;

		if (drag.type === 'move') {
			const newStart = Math.max(
				timelineStart,
				Math.min(timelineEnd - drag.duration, drag.startTime + deltaTime)
			);
			tempStart = newStart;
			tempEnd = newStart + drag.duration;
		} else if (drag.type === 'left') {
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
			isWaitingForUpdate = true;
			onResize(tempStart, tempEnd);
			// Don't set drag = null here, let the effect handle it when props update
		} else {
			drag = null;
		}
	}

	$effect(() => () => {
		document.removeEventListener('mousemove', handleMove);
		document.removeEventListener('mouseup', handleUp);
	});

	// Display values during drag
	const displayStart = $derived(drag ? tempStart : start);
	const displayEnd = $derived(drag ? tempEnd : currentEnd);
	const displayLeft = $derived(Math.max(0, displayStart - timelineStart) / total);
	const displayWidth = $derived(
		(Math.min(timelineEnd, displayEnd - timelineStart) -
			Math.max(0, displayStart - timelineStart)) /
			total
	);
</script>

<div
	class={`border-rounded-xs absolute h-full rounded-xs border-2 opacity-80 hover:opacity-100 ${isSelected ? 'opacity-100' : ''} ${drag?.type === 'move' ? 'cursor-grab' : ''}`}
	style="left: {(drag ? displayLeft : leftPercentage) * 100}%; width: {(drag
		? displayWidth
		: widthPercentage) * 100}%; background-color: {color}; border-color: {borderColor || color};"
	aria-label={name}
	title={name}
	role="button"
	tabindex="0"
	onmousedown={startMove}
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
