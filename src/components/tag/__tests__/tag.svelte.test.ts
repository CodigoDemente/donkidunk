import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Tag from '../tag.svelte';

describe('Tag Component', () => {
	describe('Rendering', () => {
		it('should render with the given text', async () => {
			render(Tag, { props: { color: '#ef4444', text: 'Important' } });
			await expect.element(page.getByText('Important')).toBeInTheDocument();
		});

		it('should render without text when not provided', async () => {
			const { container } = render(Tag, { props: { color: '#ef4444' } });
			const button = container.querySelector('button');
			expect(button).not.toBeNull();
			expect(button?.textContent?.trim()).toBe('');
		});

		it('should apply the correct background color', async () => {
			render(Tag, { props: { color: '#ef4444', text: 'Red Tag' } });
			const el = page.getByText('Red Tag').element() as HTMLElement;
			expect(el.style.backgroundColor).toBeTruthy();
		});

		it('should compute text color based on background brightness', async () => {
			// Dark background should get white text
			render(Tag, { props: { color: '#000000', text: 'Dark' } });
			const el = page.getByText('Dark').element() as HTMLElement;
			// rgb(255, 255, 255) = white text for dark bg
			expect(el.style.color).toMatch(/rgb\(255,\s*255,\s*255\)|#ffffff/i);
		});

		it('should compute black text for light backgrounds', async () => {
			render(Tag, { props: { color: '#ffffff', text: 'Light' } });
			const el = page.getByText('Light').element() as HTMLElement;
			// rgb(0, 0, 0) = black text for light bg
			expect(el.style.color).toMatch(/rgb\(0,\s*0,\s*0\)|#000000/i);
		});

		it('should apply custom className', async () => {
			render(Tag, { props: { color: '#ef4444', text: 'Styled', className: 'my-custom-class' } });
			const tag = page.getByText('Styled');
			await expect.element(tag).toHaveClass('my-custom-class');
		});
	});

	describe('Interaction', () => {
		it('should call onClick when clicked', async () => {
			const onClick = vi.fn();
			render(Tag, { props: { color: '#ef4444', text: 'Clickable', onClick } });
			const tag = page.getByText('Clickable');
			await tag.click();
			expect(onClick).toHaveBeenCalledOnce();
		});

		it('should have disabled attribute when disabled', async () => {
			render(Tag, { props: { color: '#ef4444', text: 'Disabled Tag', disabled: true } });
			const tag = page.getByText('Disabled Tag');
			await expect.element(tag).toBeInTheDocument();
			const el = tag.element() as HTMLButtonElement;
			expect(el.disabled).toBe(true);
		});

		it('should have hover:cursor-pointer class when not disabled', async () => {
			render(Tag, { props: { color: '#ef4444', text: 'Hoverable' } });
			const tag = page.getByText('Hoverable');
			await expect.element(tag).toHaveClass('hover:cursor-pointer');
		});

		it('should not have hover:cursor-pointer class when disabled', async () => {
			render(Tag, { props: { color: '#ef4444', text: 'Disabled', disabled: true } });
			const tag = page.getByText('Disabled');
			const classList = (tag.element() as HTMLElement).className;
			expect(classList).not.toContain('hover:cursor-pointer');
		});
	});
});
