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
		onContextMenu?: () => void;
		onTimeChange?: (time: number) => void;
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
		onResize,
		onContextMenu,
		onTimeChange
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
	let tempStart = $derived(start);
	let tempEnd = $derived(end || timelineEnd);
	let mouseDownPos = $state({ x: 0, y: 0 });
	let isWaitingForUpdate = $state(false);

	const currentEnd = $derived(end || timelineEnd);

	const collisionLimits = $derived({
		minStart: timelineStart,
		maxEnd: timelineEnd
	});

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
		if (e.button !== 0) return; // Only left-click starts drag
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
			const proposedStart = drag.startTime + deltaTime;
			const newStart = Math.max(
				collisionLimits.minStart,
				Math.min(collisionLimits.maxEnd - drag.duration, proposedStart)
			);
			tempStart = newStart;
			tempEnd = newStart + drag.duration;
			if (onTimeChange) onTimeChange(newStart);
		} else if (drag.type === 'left') {
			const proposedStart = drag.startTime + deltaTime;
			tempStart = Math.max(collisionLimits.minStart, Math.min(proposedStart, drag.endTime - 0.1));
			if (onTimeChange) onTimeChange(tempStart);
		} else {
			const proposedEnd = drag.endTime + deltaTime;
			tempEnd = Math.min(collisionLimits.maxEnd, Math.max(drag.startTime + 0.1, proposedEnd));
			if (onTimeChange) onTimeChange(tempEnd);
		}
	}

	function handleUp() {
		if (!drag) return;
		document.removeEventListener('mousemove', handleMove);
		document.removeEventListener('mouseup', handleUp);
		if (onResize && tempStart < tempEnd) {
			isWaitingForUpdate = true;
			onResize(tempStart, tempEnd);
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
	class={`group border-rounded-xs absolute h-full rounded-xs border-2 opacity-70 hover:opacity-90 ${isSelected ? 'opacity-90' : ''} ${drag?.type === 'move' ? 'cursor-grab' : ''}`}
	style="left: {(drag ? displayLeft : leftPercentage) * 100}%; width: {(drag
		? displayWidth
		: widthPercentage) * 100}%; background-color: {color}; border-color: {borderColor || color};"
	aria-label={name}
	role="button"
	tabindex="0"
	onmousedown={startMove}
	ondblclick={() => !drag && onDblClick && onDblClick()}
	oncontextmenu={(e) => {
		if (onContextMenu) {
			e.preventDefault();
			e.stopPropagation();
			onContextMenu();
		}
	}}
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			onClick();
			e.preventDefault();
		}
	}}
>
	{#if onResize}
		<div
			class="pointer-events-auto absolute top-0 left-0 z-20 h-full w-px cursor-ew-resize"
			role="button"
			tabindex="0"
			onmousedown={(e) => startResize(e, 'left')}
		></div>
		<div
			class="pointer-events-auto absolute top-0 right-0 z-20 h-full w-px cursor-ew-resize"
			role="button"
			tabindex="0"
			onmousedown={(e) => startResize(e, 'right')}
		></div>
	{/if}
	{#if !drag}
		<span
			class="pointer-events-none absolute top-1/2 right-1 z-30 hidden -translate-y-1/2 rounded-xs bg-gray-900/90 px-1.5 text-[10px] leading-tight whitespace-nowrap text-white shadow-sm group-hover:block"
		>
			{name}
		</span>
	{/if}
</div>
