import { describe, expect, it, vi, beforeAll, afterAll } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import ClipPreviewModal from '../components/ClipPreviewModal.svelte';
import type { GalleryClip } from '../types';

function createClip(overrides: Partial<GalleryClip> = {}): GalleryClip {
	return {
		index: 0,
		timestamps: [10, 20] as [number, number],
		buttonId: 'btn-1',
		buttonName: 'Sprint',
		buttonColor: '#3b82f6',
		categoryName: 'Events',
		tags: [],
		...overrides
	};
}

function renderModal(overrides: Record<string, unknown> = {}) {
	const defaults = {
		clip: createClip(),
		videoSrc: 'http://localhost/video.mp4',
		onClose: vi.fn(),
		...overrides
	};
	return { result: render(ClipPreviewModal, { props: defaults }), props: defaults };
}

describe('ClipPreviewModal', () => {
	const origPlay = HTMLMediaElement.prototype.play;

	beforeAll(() => {
		HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
	});

	afterAll(() => {
		HTMLMediaElement.prototype.play = origPlay;
	});

	describe('Rendering', () => {
		it('should render the modal overlay', async () => {
			const { result } = renderModal();
			const overlay = result.container.querySelector('.fixed');
			expect(overlay).not.toBeNull();
		});

		it('should display the button name', async () => {
			renderModal({ clip: createClip({ buttonName: 'Goal' }) });
			await expect.element(page.getByText('Goal')).toBeInTheDocument();
		});

		it('should display the category and time range', async () => {
			renderModal({
				clip: createClip({ categoryName: 'Actions', timestamps: [65, 130] })
			});
			await expect.element(page.getByText(/Actions/)).toBeInTheDocument();
			await expect.element(page.getByText(/01:05/)).toBeInTheDocument();
			await expect.element(page.getByText(/02:10/)).toBeInTheDocument();
		});

		it('should render a video element with controls', async () => {
			const { result } = renderModal();
			const video = result.container.querySelector('video') as HTMLVideoElement;
			expect(video).not.toBeNull();
			expect(video.controls).toBe(true);
		});

		it('should render a close button', async () => {
			renderModal();
			const closeBtn = page.getByTitle('Close');
			await expect.element(closeBtn).toBeInTheDocument();
		});
	});

	describe('Interaction', () => {
		it('should call onClose when close button is clicked', async () => {
			const onClose = vi.fn();
			renderModal({ onClose });

			const closeBtn = page.getByTitle('Close');
			await closeBtn.click();

			expect(onClose).toHaveBeenCalledOnce();
		});

		it('should call onClose when backdrop is clicked', async () => {
			const onClose = vi.fn();
			const { result } = renderModal({ onClose });

			const backdrop = result.container.querySelector('.fixed') as HTMLElement;
			backdrop.click();

			expect(onClose).toHaveBeenCalledOnce();
		});

		it('should call onClose when Escape key is pressed', async () => {
			const onClose = vi.fn();
			renderModal({ onClose });

			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

			expect(onClose).toHaveBeenCalledOnce();
		});

		it('should not call onClose when a non-Escape key is pressed', async () => {
			const onClose = vi.fn();
			renderModal({ onClose });

			window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

			expect(onClose).not.toHaveBeenCalled();
		});
	});
});
