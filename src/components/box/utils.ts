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
