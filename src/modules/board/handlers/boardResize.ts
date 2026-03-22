import { saveBoardSizeCommand } from '../../config/commands/SaveBoardSize';
import type { Config } from '../../config/context.svelte';

let isResizing = false;

export function startResize(
	setFirstBoxHeight: (h: number) => void,
	setSecondBoxHeight: (h: number) => void,
	config: Config
) {
	isResizing = true;
	// Disable transitions on boxes during resize for smooth performance
	const container = document.getElementById('boards-container');
	let firstBoxHeight = config.eventsHeight;
	let secondBoxHeight = config.tagsHeight;
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
		try {
			await saveBoardSizeCommand(firstBoxHeight, secondBoxHeight);
			config.boardSize = {
				events: firstBoxHeight,
				tags: secondBoxHeight
			};
		} finally {
			document.removeEventListener('mouseup', saveBoardSize);
		}
	}

	document.addEventListener('mousemove', resize);
	document.addEventListener('mouseup', stopResize);
	document.addEventListener('mouseup', saveBoardSize);
}
