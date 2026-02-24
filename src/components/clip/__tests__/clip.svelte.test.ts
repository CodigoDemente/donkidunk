import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Clip from '../clip.svelte';

// Helper to create a standard clip with common defaults
function renderClip(overrides: Record<string, unknown> = {}) {
	const defaults = {
		start: 10,
		end: 20,
		timelineStart: 0,
		timelineEnd: 60,
		color: '#3b82f6',
		name: 'Test Clip',
		onClick: vi.fn(),
		...overrides
	};
	return { result: render(Clip, { props: defaults }), props: defaults };
}

describe('Clip Component', () => {
	describe('Rendering', () => {
		it('should render the clip element', async () => {
			renderClip();
			const clip = page.getByRole('button', { name: 'Test Clip' });
			await expect.element(clip).toBeInTheDocument();
		});

		it('should render with the correct aria-label', async () => {
			renderClip({ name: 'My Event' });
			const clip = page.getByRole('button', { name: 'My Event' });
			await expect.element(clip).toBeInTheDocument();
		});

		it('should apply the background color via style', async () => {
			renderClip({ color: '#ef4444' });
			const el = page.getByRole('button', { name: 'Test Clip' }).element() as HTMLElement;
			expect(el.style.backgroundColor).toBeTruthy();
		});

		it('should apply border color via style', async () => {
			renderClip({ borderColor: '#f59e0b' });
			const el = page.getByRole('button', { name: 'Test Clip' }).element() as HTMLElement;
			expect(el.style.borderColor).toBeTruthy();
		});

		it('should use color as border color when borderColor not provided', async () => {
			renderClip({ color: '#3b82f6', borderColor: undefined });
			const el = page.getByRole('button', { name: 'Test Clip' }).element() as HTMLElement;
			// border-color should fallback to color
			expect(el.style.borderColor).toBeTruthy();
		});

		it('should have selected styling when isSelected', async () => {
			renderClip({ isSelected: true });
			const clip = page.getByRole('button', { name: 'Test Clip' });
			await expect.element(clip).toHaveClass('opacity-90');
		});

		it('should display the name label', async () => {
			const { result } = renderClip({ name: 'Action A' });
			const nameLabel = result.container.querySelector('span');
			expect(nameLabel).not.toBeNull();
			expect(nameLabel?.textContent).toBe('Action A');
		});
	});

	describe('Positioning', () => {
		it('should calculate left percentage correctly', async () => {
			// start=10, timelineStart=0, timelineEnd=60 => left = 10/60 * 100 ≈ 16.67%
			renderClip({ start: 10, timelineStart: 0, timelineEnd: 60 });
			const el = page.getByRole('button', { name: 'Test Clip' }).element() as HTMLElement;
			const leftValue = parseFloat(el.style.left);
			expect(leftValue).toBeCloseTo(16.67, 1);
		});

		it('should calculate width percentage correctly', async () => {
			// start=10, end=20, timelineStart=0, timelineEnd=60 => width = 10/60 * 100 ≈ 16.67%
			renderClip({ start: 10, end: 20, timelineStart: 0, timelineEnd: 60 });
			const el = page.getByRole('button', { name: 'Test Clip' }).element() as HTMLElement;
			const widthValue = parseFloat(el.style.width);
			expect(widthValue).toBeCloseTo(16.67, 1);
		});

		it('should handle clip spanning full timeline', async () => {
			renderClip({ start: 0, end: 60, timelineStart: 0, timelineEnd: 60 });
			const el = page.getByRole('button', { name: 'Test Clip' }).element() as HTMLElement;
			expect(parseFloat(el.style.left)).toBeCloseTo(0, 0);
			expect(parseFloat(el.style.width)).toBeCloseTo(100, 0);
		});
	});

	describe('Click interaction', () => {
		it('should call onClick on left click', async () => {
			const onClick = vi.fn();
			const onResize = vi.fn();
			const { result } = renderClip({ onClick, onResize });
			// startMove needs a .relative ancestor for container lookup
			result.container.classList.add('relative');
			const el = page.getByRole('button', { name: 'Test Clip' }).element() as HTMLElement;
			el.dispatchEvent(
				new MouseEvent('mousedown', { button: 0, bubbles: true, clientX: 0, clientY: 0 })
			);
			document.dispatchEvent(new MouseEvent('mouseup', { button: 0, bubbles: true }));
			expect(onClick).toHaveBeenCalledOnce();
		});

		it('should call onClick on Enter key', async () => {
			const onClick = vi.fn();
			renderClip({ onClick });
			const el = page.getByRole('button', { name: 'Test Clip' }).element() as HTMLElement;
			el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
			expect(onClick).toHaveBeenCalledOnce();
		});

		it('should call onClick on Space key', async () => {
			const onClick = vi.fn();
			renderClip({ onClick });
			const el = page.getByRole('button', { name: 'Test Clip' }).element() as HTMLElement;
			el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
			expect(onClick).toHaveBeenCalledOnce();
		});
	});

	describe('Double click', () => {
		it('should call onDblClick on double click', async () => {
			const onDblClick = vi.fn();
			renderClip({ onDblClick });
			const clip = page.getByRole('button', { name: 'Test Clip' });
			await clip.dblClick();
			expect(onDblClick).toHaveBeenCalled();
		});
	});

	describe('Context menu', () => {
		it('should call onContextMenu on right click', async () => {
			const onContextMenu = vi.fn();
			renderClip({ onContextMenu });
			const clip = page.getByRole('button', { name: 'Test Clip' });
			await clip.click({ button: 'right' });
			expect(onContextMenu).toHaveBeenCalledOnce();
		});

		it('should not call onContextMenu when not provided', async () => {
			renderClip({ onContextMenu: undefined });
			const clip = page.getByRole('button', { name: 'Test Clip' });
			// Should not throw
			await clip.click({ button: 'right' });
		});
	});

	describe('Resize handles', () => {
		it('should render resize handles when onResize is provided', async () => {
			const onResize = vi.fn();
			const { result } = renderClip({ onResize });
			const handles = result.container.querySelectorAll('.cursor-ew-resize');
			expect(handles.length).toBe(2); // Left and right handles
		});

		it('should not render resize handles when onResize is not provided', async () => {
			const { result } = renderClip({ onResize: undefined });
			const handles = result.container.querySelectorAll('.cursor-ew-resize');
			expect(handles.length).toBe(0);
		});
	});

	describe('Null end (dynamic event)', () => {
		it('should use timelineEnd when end is null', async () => {
			// When end is null, the clip should extend to timelineEnd
			renderClip({ start: 10, end: null, timelineStart: 0, timelineEnd: 60 });
			const el = page.getByRole('button', { name: 'Test Clip' }).element() as HTMLElement;
			const widthValue = parseFloat(el.style.width);
			// width = (60 - 10) / 60 * 100 ≈ 83.33%
			expect(widthValue).toBeCloseTo(83.33, 1);
		});
	});
});
