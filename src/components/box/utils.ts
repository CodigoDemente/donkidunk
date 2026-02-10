import type { Board } from '../../modules/board/context.svelte';
import type { Category } from '../../modules/board/types/Category';
import { saveBoardSizeCommand } from '../../modules/config/commands/SaveBoardSize';
import type { Config } from '../../modules/config/context.svelte';
import type { CategoryType } from './types';
let isResizing = false;

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

	// Initialize size if it doesn't exist, converting current dimensions to pixels
	if (!category.size) {
		board.updateCategorySize(type, category.id, rect.width, rect.height);
	}

	// Cache minimum content height in pixels
	if (headerElement && contentElement) {
		const headerHeight = headerElement.offsetHeight;
		const contentHeight = contentElement.scrollHeight;
		state.cachedMinHeight = headerHeight + contentHeight;
	} else {
		state.cachedMinHeight = 40; // Fallback minimum in pixels
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
	const deltaX = e.clientX - state.resizeStartX;
	const deltaY = e.clientY - state.resizeStartY;

	let newWidth = state.resizeStartWidth;
	let newHeight = state.resizeStartHeight;
	let newLeft = state.resizeStartLeft;
	let newTop = state.resizeStartTop;

	// Handle different resize directions - work in pixels
	if (state.resizeHandle.includes('right')) {
		newWidth = state.resizeStartWidth + deltaX;
	}
	if (state.resizeHandle.includes('left')) {
		newWidth = state.resizeStartWidth - deltaX;
		const deltaXPercent = (deltaX / containerRect.width) * 100;
		newLeft = state.resizeStartLeft + deltaXPercent;
	}
	if (state.resizeHandle.includes('bottom')) {
		newHeight = state.resizeStartHeight + deltaY;
	}
	if (state.resizeHandle.includes('top')) {
		newHeight = state.resizeStartHeight - deltaY;
		const deltaYPercent = (deltaY / containerRect.height) * 100;
		newTop = state.resizeStartTop + deltaYPercent;
	}

	// Apply minimum height constraint based on content (use cached pixel value)
	if (state.cachedMinHeight > 0 && newHeight < state.cachedMinHeight) {
		if (state.resizeHandle.includes('top')) {
			const heightDiff = state.cachedMinHeight - newHeight;
			const heightDiffPercent = (heightDiff / containerRect.height) * 100;
			newTop = state.resizeStartTop - heightDiffPercent;
		}
		newHeight = state.cachedMinHeight;
	}

	// Prevent overflow - position is in percentage, size is in pixels
	const widthPercent = (newWidth / containerRect.width) * 100;
	const heightPercent = (newHeight / containerRect.height) * 100;

	if (newLeft < 0) {
		newWidth = ((100 + newLeft) / 100) * containerRect.width;
		newLeft = 0;
	}
	if (newTop < 0) {
		newHeight = ((100 + newTop) / 100) * containerRect.height;
		newTop = 0;
	}
	if (newLeft + widthPercent > 100) {
		newWidth = ((100 - newLeft) / 100) * containerRect.width;
	}
	if (newTop + heightPercent > 100) {
		newHeight = ((100 - newTop) / 100) * containerRect.height;
	}

	// Update position (percentage) and size (pixels) through board context
	board.updateCategoryPosition(type, category.id, newLeft, newTop);
	board.updateCategorySize(type, category.id, newWidth, newHeight);
}

export function handleResizeEnd(state: ResizeState): void {
	// Position and size are already updated during resize
	// The board context methods handle persistence
	state.resizeHandle = null;
}

export function startResize(
	setFirstBoxHeight: (h: number) => void,
	setSecondBoxHeight: (h: number) => void,
	config: Config
) {
	isResizing = true;
	// Disable transitions on boxes during resize for smooth performance
	const container = document.getElementById('boards-container');
	let firstBoxHeight = 0;
	let secondBoxHeight = 0;
	if (container) {
		const boxes = container.querySelectorAll('[data-box]');
		boxes.forEach((box) => {
			(box as HTMLElement).style.transition = 'none';
		});
	}

	function resize(event: MouseEvent) {
		if (!isResizing) return;
		const container = document.getElementById('boards-container');
		if (!container) return;
		// Cache rect to avoid multiple calls
		const rect = container.getBoundingClientRect();
		const containerHeight = rect.height;
		const containerTop = rect.top;
		const y = event.clientY - containerTop;
		const percent = Math.min(90, Math.max(10, (y / containerHeight) * 100));
		firstBoxHeight = percent;
		secondBoxHeight = 100 - percent;
		setFirstBoxHeight(firstBoxHeight);
		setSecondBoxHeight(secondBoxHeight);
	}

	function stopResize() {
		isResizing = false;
		// Re-enable transitions after resize
		const container = document.getElementById('boards-container');
		if (container) {
			const boxes = container.querySelectorAll('[data-box]');
			boxes.forEach((box) => {
				(box as HTMLElement).style.transition = '';
			});
		}

		document.removeEventListener('mousemove', resize);
		document.removeEventListener('mouseup', stopResize);
	}

	async function saveBoardSize() {
		await saveBoardSizeCommand(firstBoxHeight, secondBoxHeight);
		config.boardSize = {
			events: firstBoxHeight,
			tags: secondBoxHeight
		};
		document.removeEventListener('mouseup', saveBoardSize);
	}

	document.addEventListener('mousemove', resize);
	document.addEventListener('mouseup', stopResize);
	document.addEventListener('mouseup', saveBoardSize);
}
