import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page, userEvent } from 'vitest/browser';
import Checkbox from '../checkbox.svelte';

describe('Checkbox Component', () => {
	describe('Rendering', () => {
		it('should render the checkbox button', async () => {
			render(Checkbox, { props: { checked: false } });
			const checkbox = page.getByRole('checkbox');
			await expect.element(checkbox).toBeInTheDocument();
		});

		it('should have aria-checked=false when unchecked', async () => {
			render(Checkbox, { props: { checked: false } });
			const checkbox = page.getByRole('checkbox');
			await expect.element(checkbox).toHaveAttribute('aria-checked', 'false');
		});

		it('should have aria-checked=true when checked', async () => {
			render(Checkbox, { props: { checked: true } });
			const checkbox = page.getByRole('checkbox');
			await expect.element(checkbox).toHaveAttribute('aria-checked', 'true');
		});

		it('should render label text when provided', async () => {
			render(Checkbox, { props: { checked: false, label: 'Accept Terms' } });
			await expect.element(page.getByText('Accept Terms')).toBeInTheDocument();
		});

		it('should not render label span when label is empty', async () => {
			const { container } = render(Checkbox, { props: { checked: false } });
			const spans = container.querySelectorAll('span.text-sm');
			expect(spans.length).toBe(0);
		});

		it('should use label as aria-label', async () => {
			render(Checkbox, { props: { checked: false, label: 'My Label' } });
			const checkbox = page.getByRole('checkbox');
			await expect.element(checkbox).toHaveAttribute('aria-label', 'My Label');
		});

		it('should use default aria-label when no label provided', async () => {
			render(Checkbox, { props: { checked: false } });
			const checkbox = page.getByRole('checkbox');
			await expect.element(checkbox).toHaveAttribute('aria-label', 'checkbox');
		});

		it('should render the checkmark SVG when checked', async () => {
			const { container } = render(Checkbox, { props: { checked: true } });
			const svg = container.querySelector('svg');
			expect(svg).not.toBeNull();
		});

		it('should not render the checkmark SVG when unchecked', async () => {
			const { container } = render(Checkbox, { props: { checked: false } });
			const svg = container.querySelector('svg');
			expect(svg).toBeNull();
		});

		it('should apply custom className', async () => {
			const { container } = render(Checkbox, {
				props: { checked: false, className: 'my-checkbox' }
			});
			const label = container.querySelector('label');
			expect(label?.classList.contains('my-checkbox')).toBe(true);
		});

		it('should apply custom id', async () => {
			const { container } = render(Checkbox, {
				props: { checked: false, id: 'terms-checkbox' }
			});
			const label = container.querySelector('label');
			expect(label?.getAttribute('id')).toBe('terms-checkbox');
		});
	});

	describe('Interaction', () => {
		it('should toggle when clicked', async () => {
			const onChange = vi.fn();
			render(Checkbox, { props: { checked: false, onChange } });
			const checkbox = page.getByRole('checkbox');
			await checkbox.click();
			expect(onChange).toHaveBeenCalledWith(true);
		});

		it('should toggle off when clicking a checked checkbox', async () => {
			const onChange = vi.fn();
			render(Checkbox, { props: { checked: true, onChange } });
			const checkbox = page.getByRole('checkbox');
			await checkbox.click();
			expect(onChange).toHaveBeenCalledWith(false);
		});

		it('should not toggle when disabled', async () => {
			const onChange = vi.fn();
			render(Checkbox, { props: { checked: false, onChange, disabled: true } });
			const checkbox = page.getByRole('checkbox');
			await expect.element(checkbox).toBeDisabled();
			// Dispatch raw click - handler should block because disabled
			const el = checkbox.element() as HTMLElement;
			el.click();
			expect(onChange).not.toHaveBeenCalled();
		});

		it('should toggle on Space key press', async () => {
			const onChange = vi.fn();
			render(Checkbox, { props: { checked: false, onChange } });
			const checkbox = page.getByRole('checkbox');
			await checkbox.click(); // focus
			await userEvent.keyboard('{ }');
			expect(onChange).toHaveBeenCalledWith(true);
		});

		it('should toggle on Enter key press', async () => {
			const onChange = vi.fn();
			render(Checkbox, { props: { checked: false, onChange } });
			const checkbox = page.getByRole('checkbox');
			await checkbox.click(); // focus
			await userEvent.keyboard('{Enter}');
			expect(onChange).toHaveBeenCalledWith(true);
		});

		it('should not toggle on Space key when disabled', async () => {
			const onChange = vi.fn();
			render(Checkbox, { props: { checked: false, onChange, disabled: true } });
			const checkbox = page.getByRole('checkbox');
			await expect.element(checkbox).toBeDisabled();
			// Dispatch raw keydown - handler should block because disabled
			const el = checkbox.element() as HTMLElement;
			el.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
			expect(onChange).not.toHaveBeenCalled();
		});
	});

	describe('Disabled state', () => {
		it('should have disabled attribute', async () => {
			render(Checkbox, { props: { checked: false, disabled: true } });
			const checkbox = page.getByRole('checkbox');
			await expect.element(checkbox).toBeDisabled();
		});

		it('should have tabindex -1 when disabled', async () => {
			render(Checkbox, { props: { checked: false, disabled: true } });
			const checkbox = page.getByRole('checkbox');
			await expect.element(checkbox).toHaveAttribute('tabindex', '-1');
		});

		it('should have tabindex 0 when enabled', async () => {
			render(Checkbox, { props: { checked: false } });
			const checkbox = page.getByRole('checkbox');
			await expect.element(checkbox).toHaveAttribute('tabindex', '0');
		});

		it('should apply cursor-not-allowed when disabled', async () => {
			const { container } = render(Checkbox, { props: { checked: false, disabled: true } });
			const label = container.querySelector('label');
			expect(label?.classList.contains('cursor-not-allowed')).toBe(true);
		});

		it('should apply cursor-pointer when enabled', async () => {
			const { container } = render(Checkbox, { props: { checked: false } });
			const label = container.querySelector('label');
			expect(label?.classList.contains('cursor-pointer')).toBe(true);
		});
	});
});
