import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Multiselect from '../multiselect.svelte';

const mockOptions = [
	{ id: '1', value: 'red', label: 'Red', color: '#ef4444' },
	{ id: '2', value: 'blue', label: 'Blue', color: '#3b82f6' },
	{ id: '3', value: 'green', label: 'Green', color: '#22c55e' }
];

describe('Multiselect Component', () => {
	describe('Rendering', () => {
		it('should render all options as buttons', async () => {
			render(Multiselect, { props: { options: mockOptions, selectedValues: [] } });
			await expect.element(page.getByText('Red')).toBeInTheDocument();
			await expect.element(page.getByText('Blue')).toBeInTheDocument();
			await expect.element(page.getByText('Green')).toBeInTheDocument();
		});

		it('should apply background color from option', async () => {
			render(Multiselect, { props: { options: mockOptions, selectedValues: [] } });
			const el = page.getByText('Red').element() as HTMLElement;
			expect(el.style.backgroundColor).toBeTruthy();
		});

		it('should show selected options with ring highlight', async () => {
			render(Multiselect, { props: { options: mockOptions, selectedValues: ['red'] } });
			const redButton = page.getByText('Red');
			await expect.element(redButton).toHaveClass('ring-2');
		});

		it('should show unselected options with reduced opacity', async () => {
			render(Multiselect, { props: { options: mockOptions, selectedValues: ['red'] } });
			const blueButton = page.getByText('Blue');
			await expect.element(blueButton).toHaveClass('opacity-50');
		});

		it('should have aria-pressed attribute for each option', async () => {
			render(Multiselect, { props: { options: mockOptions, selectedValues: ['red'] } });
			const redButton = page.getByText('Red');
			const blueButton = page.getByText('Blue');
			await expect.element(redButton).toHaveAttribute('aria-pressed', 'true');
			await expect.element(blueButton).toHaveAttribute('aria-pressed', 'false');
		});

		it('should render with empty options', async () => {
			const { container } = render(Multiselect, {
				props: { options: [], selectedValues: [] }
			});
			expect(container.querySelectorAll('button').length).toBe(0);
		});
	});

	describe('Selection', () => {
		it('should call onSelectionChange when selecting an option', async () => {
			const onSelectionChange = vi.fn();
			render(Multiselect, {
				props: { options: mockOptions, selectedValues: [], onSelectionChange }
			});
			const blueButton = page.getByText('Blue');
			await blueButton.click();
			expect(onSelectionChange).toHaveBeenCalledWith(['blue']);
		});

		it('should call onSelectionChange when deselecting an option', async () => {
			const onSelectionChange = vi.fn();
			render(Multiselect, {
				props: { options: mockOptions, selectedValues: ['red', 'blue'], onSelectionChange }
			});
			const redButton = page.getByText('Red');
			await redButton.click();
			expect(onSelectionChange).toHaveBeenCalledWith(['blue']);
		});

		it('should support multiple selections', async () => {
			const onSelectionChange = vi.fn();
			render(Multiselect, {
				props: { options: mockOptions, selectedValues: ['red'], onSelectionChange }
			});
			const blueButton = page.getByText('Blue');
			await blueButton.click();
			expect(onSelectionChange).toHaveBeenCalledWith(['red', 'blue']);
		});
	});

	describe('maxChips', () => {
		it('should not add more selections beyond maxChips but still fires callback', async () => {
			const onSelectionChange = vi.fn();
			render(Multiselect, {
				props: {
					options: mockOptions,
					selectedValues: ['red', 'blue'],
					maxChips: 2,
					onSelectionChange
				}
			});
			const greenButton = page.getByText('Green');
			await greenButton.click();
			// The callback fires with unchanged array (green not added)
			expect(onSelectionChange).toHaveBeenCalledWith(['red', 'blue']);
		});

		it('should allow deselecting when at max capacity', async () => {
			const onSelectionChange = vi.fn();
			render(Multiselect, {
				props: {
					options: mockOptions,
					selectedValues: ['red', 'blue'],
					maxChips: 2,
					onSelectionChange
				}
			});
			const redButton = page.getByText('Red');
			await redButton.click();
			expect(onSelectionChange).toHaveBeenCalledWith(['blue']);
		});
	});

	describe('Disabled state', () => {
		it('should disable all option buttons when disabled', async () => {
			const { container } = render(Multiselect, {
				props: { options: mockOptions, selectedValues: [], disabled: true }
			});
			const buttons = container.querySelectorAll('button');
			buttons.forEach((btn) => {
				expect(btn.disabled).toBe(true);
			});
		});

		it('should apply cursor-not-allowed and reduced opacity when disabled', async () => {
			const { container } = render(Multiselect, {
				props: { options: mockOptions, selectedValues: [], disabled: true }
			});
			const wrapper = container.querySelector('[class*="cursor-not-allowed"]');
			expect(wrapper).not.toBeNull();
		});

		it('should not trigger selection when disabled', async () => {
			const onSelectionChange = vi.fn();
			render(Multiselect, {
				props: { options: mockOptions, selectedValues: [], disabled: true, onSelectionChange }
			});
			// Verify button is disabled, then dispatch raw click
			const el = page.getByText('Red').element() as HTMLButtonElement;
			expect(el.disabled).toBe(true);
			el.click();
			expect(onSelectionChange).not.toHaveBeenCalled();
		});
	});

	describe('Default chip color', () => {
		it('should use defaultChipColor when option has no color', async () => {
			const optionsWithoutColor = [{ id: '1', value: 'test', label: 'No Color' }];
			render(Multiselect, {
				props: {
					options: optionsWithoutColor,
					selectedValues: [],
					defaultChipColor: '#8b5cf6'
				}
			});
			const el = page.getByText('No Color').element() as HTMLElement;
			expect(el.style.backgroundColor).toBeTruthy();
		});
	});

	describe('Sizes', () => {
		it('should apply medium size by default', async () => {
			const { container } = render(Multiselect, {
				props: { options: mockOptions, selectedValues: [] }
			});
			const wrapper = container.querySelector('.w-46');
			expect(wrapper).not.toBeNull();
		});

		it('should apply full size', async () => {
			const { container } = render(Multiselect, {
				props: { options: mockOptions, selectedValues: [], size: 'full' }
			});
			const wrapper = container.querySelector('.w-full');
			expect(wrapper).not.toBeNull();
		});
	});
});
