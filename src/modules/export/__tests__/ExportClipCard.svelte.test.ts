import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import ExportClipCard from '../components/ExportClipCard.svelte';
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

function renderCard(overrides: Record<string, unknown> = {}) {
	const defaults = {
		clip: createClip(),
		videoSrc: 'http://localhost/video.mp4',
		...overrides
	};
	return render(ExportClipCard, { props: defaults });
}

describe('ExportClipCard', () => {
	describe('Rendering', () => {
		it('should render the clip index (1-based)', async () => {
			renderCard({ clip: createClip({ index: 3 }) });
			await expect.element(page.getByText('4')).toBeInTheDocument();
		});

		it('should render the button name and category', async () => {
			renderCard({ clip: createClip({ buttonName: 'Goal', categoryName: 'Actions' }) });
			await expect.element(page.getByText('Goal (Actions)')).toBeInTheDocument();
		});

		it('should render the time range', async () => {
			renderCard({ clip: createClip({ timestamps: [65, 130] }) });
			await expect.element(page.getByText('01:05 - 02:10')).toBeInTheDocument();
		});

		it('should render tags when present', async () => {
			const clip = createClip({
				tags: [
					{ id: 'tag-1', name: 'Important', color: '#ef4444' },
					{ id: 'tag-2', name: 'Review', color: '#22c55e' }
				]
			});
			renderCard({ clip });
			await expect.element(page.getByText('Important')).toBeInTheDocument();
			await expect.element(page.getByText('Review')).toBeInTheDocument();
		});

		it('should not render tags section when tags are empty', async () => {
			const { container } = renderCard({ clip: createClip({ tags: [] }) });
			const tagElements = container.querySelectorAll('[class*="flex-wrap"]');
			expect(tagElements.length).toBe(0);
		});

		it('should set the video thumbnail src with timestamp fragment', async () => {
			const { container } = renderCard({
				clip: createClip({ timestamps: [42, 60] }),
				videoSrc: 'http://localhost/video.mp4'
			});
			const video = container.querySelector('video') as HTMLVideoElement;
			expect(video).not.toBeNull();
			expect(video.src).toContain('#t=42');
		});

		it('should set video to preload metadata only', async () => {
			const { container } = renderCard();
			const video = container.querySelector('video') as HTMLVideoElement;
			expect(video?.preload).toBe('metadata');
		});

		it('should disable pointer events on the video element', async () => {
			const { container } = renderCard();
			const video = container.querySelector('video') as HTMLVideoElement;
			expect(video?.classList.contains('pointer-events-none')).toBe(true);
		});
	});

	describe('Interaction', () => {
		it('should call onExpand with the clip when clicked', async () => {
			const onExpand = vi.fn();
			const clip = createClip();
			renderCard({ clip, onExpand });

			const card = page.getByRole('listitem');
			await card.click();

			expect(onExpand).toHaveBeenCalledOnce();
			expect(onExpand).toHaveBeenCalledWith(clip);
		});

		it('should show expand overlay on hover when onExpand is provided', async () => {
			const { container } = renderCard({ onExpand: vi.fn() });
			const overlay = container.querySelector('[class*="group-hover"]');
			expect(overlay).not.toBeNull();
		});

		it('should be draggable', async () => {
			const { container } = renderCard();
			const card = container.querySelector('[draggable="true"]');
			expect(card).not.toBeNull();
		});

		it('should call ondragstart when dragged', async () => {
			const ondragstart = vi.fn();
			const { container } = renderCard({ ondragstart });
			const card = container.querySelector('[draggable="true"]') as HTMLElement;

			card.dispatchEvent(new DragEvent('dragstart', { bubbles: true }));
			expect(ondragstart).toHaveBeenCalledOnce();
		});
	});

	describe('Button color styling', () => {
		it('should apply the button color as background', async () => {
			const { container } = renderCard({
				clip: createClip({ buttonColor: '#ef4444', buttonName: 'Goal', categoryName: 'X' })
			});
			const badge = container.querySelector('[style*="background-color"]') as HTMLElement;
			expect(badge).not.toBeNull();
			expect(badge.style.backgroundColor).toBeTruthy();
		});
	});
});
