let isResizing = false;

export function startVideoPlayerResize(
	setTopHeight: (h: number) => void,
	setBottomHeight: (h: number) => void
) {
	isResizing = true;

	const container = document.getElementById('videoplayer-container');
	if (container) {
		const sections = container.querySelectorAll('[data-vp-section]');
		sections.forEach((el) => {
			(el as HTMLElement).style.transition = 'none';
		});
	}

	function resize(event: MouseEvent) {
		if (!isResizing) return;
		const container = document.getElementById('videoplayer-container');
		if (!container) return;

		const rect = container.getBoundingClientRect();
		const y = event.clientY - rect.top;
		const percent = Math.min(85, Math.max(20, (y / rect.height) * 100));
		setTopHeight(percent);
		setBottomHeight(100 - percent);
	}

	function stopResize() {
		isResizing = false;

		const container = document.getElementById('videoplayer-container');
		if (container) {
			const sections = container.querySelectorAll('[data-vp-section]');
			sections.forEach((el) => {
				(el as HTMLElement).style.transition = '';
			});
		}

		document.removeEventListener('mousemove', resize);
		document.removeEventListener('mouseup', stopResize);
	}

	document.addEventListener('mousemove', resize);
	document.addEventListener('mouseup', stopResize);
}
