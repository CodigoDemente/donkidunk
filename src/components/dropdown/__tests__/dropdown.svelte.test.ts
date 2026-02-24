import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Dropdown from '../dropdown.svelte';

const mockOptions = [
	{ value: 'a', label: 'Option A' },
	{ value: 'b', label: 'Option B' },
	{ value: 'c', label: 'Option C' }
];

describe('Dropdown Component', () => {
	describe('Rendering', () => {
		it('should render a dropdown button', async () => {
			render(Dropdown, { props: { options: mockOptions, value: '' } });
			const trigger = page.getByRole('button');
			await expect.element(trigger).toBeInTheDocument();
		});

		it('should show placeholder when no value is selected', async () => {
			render(Dropdown, {
				props: { options: mockOptions, value: '', placeholder: 'Choose...' }
			});
			await expect.element(page.getByText('Choose...')).toBeInTheDocument();
		});

		it('should show selected option label', async () => {
			render(Dropdown, { props: { options: mockOptions, value: 'b' } });
			await expect.element(page.getByText('Option B')).toBeInTheDocument();
		});

		it('should render a label when provided', async () => {
			render(Dropdown, {
				props: { options: mockOptions, value: '', label: 'Pick one' }
			});
			await expect.element(page.getByText('Pick one')).toBeInTheDocument();
		});

		it('should have aria-haspopup attribute', async () => {
			render(Dropdown, { props: { options: mockOptions, value: '' } });
			const trigger = page.getByRole('button');
			await expect.element(trigger).toHaveAttribute('aria-haspopup', 'listbox');
		});

		it('should have aria-expanded=false initially', async () => {
			render(Dropdown, { props: { options: mockOptions, value: '' } });
			const trigger = page.getByRole('button');
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
		});
	});

	describe('Opening and Closing', () => {
		it('should open dropdown when clicking trigger', async () => {
			render(Dropdown, { props: { options: mockOptions, value: '' } });
			const trigger = page.getByRole('button');
			await trigger.click();

			const listbox = page.getByRole('listbox');
			await expect.element(listbox).toBeInTheDocument();
		});

		it('should set aria-expanded=true when open', async () => {
			render(Dropdown, { props: { options: mockOptions, value: '' } });
			const trigger = page.getByRole('button');
			await trigger.click();
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
		});

		it('should display all options when open', async () => {
			render(Dropdown, { props: { options: mockOptions, value: '' } });
			const trigger = page.getByRole('button');
			await trigger.click();

			await expect.element(page.getByText('Option A')).toBeInTheDocument();
			await expect.element(page.getByText('Option B')).toBeInTheDocument();
			await expect.element(page.getByText('Option C')).toBeInTheDocument();
		});

		it('should close dropdown when clicking trigger again', async () => {
			render(Dropdown, { props: { options: mockOptions, value: '' } });
			const trigger = page.getByRole('button');
			await trigger.click();
			await trigger.click();
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
		});
	});

	describe('Selection', () => {
		it('should mark selected option with aria-selected', async () => {
			render(Dropdown, { props: { options: mockOptions, value: 'b' } });
			const trigger = page.getByRole('button');
			await trigger.click();

			const selectedOption = page.getByRole('option', { name: 'Option B' });
			await expect.element(selectedOption).toHaveAttribute('aria-selected', 'true');
		});

		it('should mark non-selected options with aria-selected=false', async () => {
			render(Dropdown, { props: { options: mockOptions, value: 'b' } });
			const trigger = page.getByRole('button');
			await trigger.click();

			const otherOption = page.getByRole('option', { name: 'Option A' });
			await expect.element(otherOption).toHaveAttribute('aria-selected', 'false');
		});
	});

	describe('Disabled state', () => {
		it('should be disabled when disabled prop is true', async () => {
			render(Dropdown, { props: { options: mockOptions, value: '', disabled: true } });
			const trigger = page.getByRole('button');
			await expect.element(trigger).toBeDisabled();
		});

		it('should not open when clicking disabled button', async () => {
			render(Dropdown, { props: { options: mockOptions, value: '', disabled: true } });
			const trigger = page.getByRole('button');
			// Verify disabled, then dispatch raw click
			await expect.element(trigger).toBeDisabled();
			const el = trigger.element() as HTMLElement;
			el.click();
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
		});
	});

	describe('Error state', () => {
		it('should display error message', async () => {
			render(Dropdown, {
				props: { options: mockOptions, value: '', error: 'Selection required' }
			});
			await expect.element(page.getByText('Selection required')).toBeInTheDocument();
		});

		it('should render error in red', async () => {
			const { container } = render(Dropdown, {
				props: { options: mockOptions, value: '', error: 'Error text' }
			});
			const errorEl = container.querySelector('.text-red-400');
			expect(errorEl).not.toBeNull();
			expect(errorEl?.textContent).toBe('Error text');
		});
	});

	describe('Sizes', () => {
		it('should apply medium size by default', async () => {
			const { container } = render(Dropdown, {
				props: { options: mockOptions, value: '' }
			});
			const trigger = container.querySelector('button');
			expect(trigger?.classList.contains('w-28')).toBe(true);
		});

		it('should apply large size', async () => {
			const { container } = render(Dropdown, {
				props: { options: mockOptions, value: '', size: 'large' }
			});
			const trigger = container.querySelector('button');
			expect(trigger?.classList.contains('w-46')).toBe(true);
		});

		it('should apply full size', async () => {
			const { container } = render(Dropdown, {
				props: { options: mockOptions, value: '', size: 'full' }
			});
			const trigger = container.querySelector('button');
			expect(trigger?.classList.contains('w-full')).toBe(true);
		});
	});

	describe('Empty options', () => {
		it('should render with no options', async () => {
			render(Dropdown, { props: { options: [], value: '' } });
			const trigger = page.getByRole('button');
			await trigger.click();
			const listbox = page.getByRole('listbox');
			await expect.element(listbox).toBeInTheDocument();
		});
	});
});
