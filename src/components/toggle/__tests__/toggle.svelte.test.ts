import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import Toggle from '../toggle.svelte';

describe('Toggle Component', () => {
	describe('Rendering', () => {
		it('should render the toggle button', async () => {
			render(Toggle, { props: { checked: false } });
			const toggle = page.getByRole('button', { name: 'toggle' });
			await expect.element(toggle).toBeInTheDocument();
		});

		it('should have aria-pressed=false when unchecked', async () => {
			render(Toggle, { props: { checked: false } });
			const toggle = page.getByRole('button', { name: 'toggle' });
			await expect.element(toggle).toHaveAttribute('aria-pressed', 'false');
		});

		it('should have aria-pressed=true when checked', async () => {
			render(Toggle, { props: { checked: true } });
			const toggle = page.getByRole('button', { name: 'toggle' });
			await expect.element(toggle).toHaveAttribute('aria-pressed', 'true');
		});

		it('should render the truthy label when provided', async () => {
			render(Toggle, { props: { checked: false, labelTruthy: 'On' } });
			await expect.element(page.getByText('On')).toBeInTheDocument();
		});

		it('should render the falsy label when provided', async () => {
			render(Toggle, { props: { checked: false, labelFalsy: 'Off' } });
			await expect.element(page.getByText('Off')).toBeInTheDocument();
		});

		it('should render both labels when both provided', async () => {
			render(Toggle, {
				props: { checked: false, labelFalsy: 'Board', labelTruthy: 'Timeline' }
			});
			await expect.element(page.getByText('Board')).toBeInTheDocument();
			await expect.element(page.getByText('Timeline')).toBeInTheDocument();
		});

		it('should apply custom className', async () => {
			const { container } = render(Toggle, {
				props: { checked: false, className: 'custom-toggle' }
			});
			const wrapper = container.querySelector('.custom-toggle');
			expect(wrapper).not.toBeNull();
		});
	});

	describe('Interaction', () => {
		it('should call onChange with true when clicking an unchecked toggle', async () => {
			const onChange = vi.fn();
			render(Toggle, { props: { checked: false, onChange } });
			const toggle = page.getByRole('button', { name: 'toggle' });
			await toggle.click();
			expect(onChange).toHaveBeenCalledWith(true);
		});

		it('should call onChange with false when clicking a checked toggle', async () => {
			const onChange = vi.fn();
			render(Toggle, { props: { checked: true, onChange } });
			const toggle = page.getByRole('button', { name: 'toggle' });
			await toggle.click();
			expect(onChange).toHaveBeenCalledWith(false);
		});

		it('should not call onChange when disabled', async () => {
			const onChange = vi.fn();
			render(Toggle, { props: { checked: false, onChange, disabled: true } });
			// Verify the button is disabled - don't try to click it
			const toggle = page.getByRole('button', { name: 'toggle' });
			await expect.element(toggle).toBeDisabled();
			// Dispatch a raw click event to verify handler blocks it
			const el = toggle.element() as HTMLElement;
			el.click();
			expect(onChange).not.toHaveBeenCalled();
		});

		it('should toggle on Space key', async () => {
			const onChange = vi.fn();
			render(Toggle, { props: { checked: false, onChange } });
			const toggle = page.getByRole('button', { name: 'toggle' });
			await toggle.click(); // focus
			await userEvent.keyboard('{ }');
			expect(onChange).toHaveBeenCalledWith(true);
		});

		it('should toggle on Enter key', async () => {
			const onChange = vi.fn();
			render(Toggle, { props: { checked: false, onChange } });
			const toggle = page.getByRole('button', { name: 'toggle' });
			await toggle.click(); // focus
			await userEvent.keyboard('{Enter}');
			expect(onChange).toHaveBeenCalledWith(true);
		});

		it('should not toggle on Space key when disabled', async () => {
			const onChange = vi.fn();
			render(Toggle, { props: { checked: false, onChange, disabled: true } });
			const toggle = page.getByRole('button', { name: 'toggle' });
			await expect.element(toggle).toBeDisabled();
			// Dispatch raw keydown - handler should block because disabled
			const el = toggle.element() as HTMLElement;
			el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
			expect(onChange).not.toHaveBeenCalled();
		});
	});

	describe('Disabled state', () => {
		it('should have disabled attribute when disabled', async () => {
			render(Toggle, { props: { checked: false, disabled: true } });
			const toggle = page.getByRole('button', { name: 'toggle' });
			await expect.element(toggle).toBeDisabled();
		});

		it('should have tabindex -1 when disabled', async () => {
			render(Toggle, { props: { checked: false, disabled: true } });
			const toggle = page.getByRole('button', { name: 'toggle' });
			await expect.element(toggle).toHaveAttribute('tabindex', '-1');
		});

		it('should have tabindex 0 when enabled', async () => {
			render(Toggle, { props: { checked: false } });
			const toggle = page.getByRole('button', { name: 'toggle' });
			await expect.element(toggle).toHaveAttribute('tabindex', '0');
		});
	});

	describe('Visual state', () => {
		it('should translate the thumb when checked', async () => {
			const { container } = render(Toggle, { props: { checked: true } });
			const thumb = container.querySelector('button span');
			expect(thumb).not.toBeNull();
			expect(thumb?.getAttribute('style')).toContain('translateX(1rem)');
		});

		it('should not translate the thumb when unchecked', async () => {
			const { container } = render(Toggle, { props: { checked: false } });
			const thumb = container.querySelector('button span');
			expect(thumb).not.toBeNull();
			// Browser normalizes to 0px
			const style = thumb?.getAttribute('style') || '';
			expect(style).toMatch(/translateX\(0(px)?\)/);
		});
	});
});
