import type { Board } from '../../modules/board/context.svelte';
import type { Category } from '../../modules/board/types/Category';
import type { CategoryType } from './types';

let isResizing = false;
let frame: number | null = null;
let setBoxHeight: (h: number) => void;

function resize(e: MouseEvent) {
	if (!isResizing || !setBoxHeight) return;
	if (frame) cancelAnimationFrame(frame);
	frame = requestAnimationFrame(() => {
		const container = document.getElementById('boards-container');
		if (!container) return;
		const rect = container.getBoundingClientRect();
		const y = e.clientY - rect.top;
		const percent = Math.max(10, Math.min(90, (y / rect.height) * 100));
		setBoxHeight(percent);
	});
}

export function startResize(setter: (h: number) => void) {
	isResizing = true;
	setBoxHeight = setter;
	document.body.style.cursor = 'row-resize';
	window.addEventListener('mousemove', resize);
	window.addEventListener('mouseup', stopResize);
	window.addEventListener('mouseleave', stopResize);
}
function stopResize() {
	isResizing = false;
	document.body.style.cursor = '';
	window.removeEventListener('mousemove', resize);
	window.removeEventListener('mouseup', stopResize);
	window.removeEventListener('mouseleave', stopResize);
}

export type ResizeState = {
	resizeHandle: string | null;
	resizeStartX: number;
	resizeStartY: number;
	resizeStartWidth: number;
	resizeStartHeight: number;
	resizeStartLeft: number;
	resizeStartTop: number;
	containerElement: HTMLElement | null;
	cachedMinHeight: number;
};

export function createResizeState(): ResizeState {
	return {
		resizeHandle: null,
		resizeStartX: 0,
		resizeStartY: 0,
		resizeStartWidth: 0,
		resizeStartHeight: 0,
		resizeStartLeft: 0,
		resizeStartTop: 0,
		containerElement: null,
		cachedMinHeight: 0
	};
}

export function handleResizeStart(
	e: MouseEvent,
	handle: string,
	state: ResizeState,
	categoryElement: HTMLDivElement,
	headerElement: HTMLDivElement,
	contentElement: HTMLDivElement,
	category: Category,
	type: CategoryType,
	board: Board
): void {
	e.preventDefault();
	e.stopPropagation();
	e.stopImmediatePropagation();

	state.resizeHandle = handle;

	if (!categoryElement || !categoryElement.parentElement) return;

	state.containerElement = categoryElement.parentElement;
	const rect = categoryElement.getBoundingClientRect();
	const containerRect = state.containerElement.getBoundingClientRect();

	state.resizeStartX = e.clientX;
	state.resizeStartY = e.clientY;
	state.resizeStartWidth = rect.width;
	state.resizeStartHeight = rect.height;
	state.resizeStartLeft = ((rect.left - containerRect.left) / containerRect.width) * 100;
	state.resizeStartTop = ((rect.top - containerRect.top) / containerRect.height) * 100;

	// Initialize size if it doesn't exist, converting current dimensions to percentages
	if (!category.size) {
		const currentWidthPercent = (rect.width / containerRect.width) * 100;
		const currentHeightPercent = (rect.height / containerRect.height) * 100;
		board.updateCategorySize(type, category.id, currentWidthPercent, currentHeightPercent);
	}

	// Cache minimum content height at the start of resize
	if (headerElement && contentElement) {
		const headerHeight = headerElement.offsetHeight;
		const contentHeight = contentElement.scrollHeight;
		const minHeightPx = headerHeight + contentHeight;
		state.cachedMinHeight = (minHeightPx / containerRect.height) * 100;
	} else {
		state.cachedMinHeight = 5; // Fallback minimum
	}
}

export function handleResizeMove(
	e: MouseEvent,
	state: ResizeState,
	categoryElement: HTMLDivElement,
	category: Category,
	type: CategoryType,
	board: Board
): void {
	if (!state.resizeHandle || !categoryElement || !state.containerElement) return;

	const containerRect = state.containerElement.getBoundingClientRect();
	const deltaX = ((e.clientX - state.resizeStartX) / containerRect.width) * 100;
	const deltaY = ((e.clientY - state.resizeStartY) / containerRect.height) * 100;

	const startWidthPercent = (state.resizeStartWidth / containerRect.width) * 100;
	const startHeightPercent = (state.resizeStartHeight / containerRect.height) * 100;

	let newWidth = startWidthPercent;
	let newHeight = startHeightPercent;
	let newLeft = state.resizeStartLeft;
	let newTop = state.resizeStartTop;

	// Handle different resize directions
	if (state.resizeHandle.includes('right')) {
		newWidth = startWidthPercent + deltaX;
	}
	if (state.resizeHandle.includes('left')) {
		newWidth = startWidthPercent - deltaX;
		newLeft = state.resizeStartLeft + deltaX;
	}
	if (state.resizeHandle.includes('bottom')) {
		newHeight = startHeightPercent + deltaY;
	}
	if (state.resizeHandle.includes('top')) {
		newHeight = startHeightPercent - deltaY;
		newTop = state.resizeStartTop + deltaY;
	}

	// Apply minimum height constraint based on content (use cached value)
	if (state.cachedMinHeight > 0 && newHeight < state.cachedMinHeight) {
		if (state.resizeHandle.includes('top')) {
			newTop = state.resizeStartTop + startHeightPercent - state.cachedMinHeight;
		}
		newHeight = state.cachedMinHeight;
	}

	// Prevent overflow
	if (newLeft < 0) {
		newWidth += newLeft;
		newLeft = 0;
	}
	if (newTop < 0) {
		newHeight += newTop;
		newTop = 0;
	}
	if (newLeft + newWidth > 100) {
		newWidth = 100 - newLeft;
	}
	if (newTop + newHeight > 100) {
		newHeight = 100 - newTop;
	}

	// Update position and size through board context (avoids mutating props)
	board.updateCategoryPosition(type, category.id, newLeft, newTop);
	board.updateCategorySize(type, category.id, newWidth, newHeight);
}

export function handleResizeEnd(state: ResizeState): void {
	// Position and size are already updated during resize
	// The board context methods handle persistence
	state.resizeHandle = null;
}
