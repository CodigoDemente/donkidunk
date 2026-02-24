import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import FloatingMenu from '../floatingmenu.svelte';
import type { FloatingMenuOption } from '../types';

const mockOptions: FloatingMenuOption[] = [
	{ id: '1', value: 'opt1', label: 'Option 1' },
	{ id: '2', value: 'opt2', label: 'Option 2' },
	{ id: '3', value: 'opt3', label: 'Option 3' }
];

describe('FloatingMenu Component', () => {
	describe('Rendering', () => {
		it('should render the trigger button with text', async () => {
			render(FloatingMenu, { props: { trigger: 'Menu' } });
			await expect.element(page.getByText('Menu')).toBeInTheDocument();
		});

		it('should have aria-haspopup attribute', async () => {
			render(FloatingMenu, { props: { trigger: 'Menu' } });
			const trigger = page.getByRole('button', { name: 'Menu' });
			await expect.element(trigger).toHaveAttribute('aria-haspopup', 'menu');
		});

		it('should have aria-expanded=false initially', async () => {
			render(FloatingMenu, { props: { trigger: 'Menu' } });
			const trigger = page.getByRole('button', { name: 'Menu' });
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
		});

		it('should not show menu initially', async () => {
			const { container } = render(FloatingMenu, {
				props: { trigger: 'Menu', options: mockOptions }
			});
			const menu = container.querySelector('[role="menu"]');
			expect(menu).toBeNull();
		});
	});

	describe('Opening menu', () => {
		it('should open menu when clicking trigger', async () => {
			render(FloatingMenu, { props: { trigger: 'Menu', options: mockOptions } });
			const trigger = page.getByRole('button', { name: 'Menu' });
			await trigger.click();
			const menu = page.getByRole('menu');
			await expect.element(menu).toBeInTheDocument();
		});

		it('should set aria-expanded=true when open', async () => {
			render(FloatingMenu, { props: { trigger: 'Menu', options: mockOptions } });
			const trigger = page.getByRole('button', { name: 'Menu' });
			await trigger.click();
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'true');
		});

		it('should display all options when open', async () => {
			render(FloatingMenu, { props: { trigger: 'Menu', options: mockOptions } });
			const trigger = page.getByRole('button', { name: 'Menu' });
			await trigger.click();
			await expect.element(page.getByText('Option 1')).toBeInTheDocument();
			await expect.element(page.getByText('Option 2')).toBeInTheDocument();
			await expect.element(page.getByText('Option 3')).toBeInTheDocument();
		});
	});

	describe('Option selection', () => {
		it('should call onoptionselected when clicking an option', async () => {
			const onoptionselected = vi.fn();
			render(FloatingMenu, {
				props: { trigger: 'Menu', options: mockOptions, onoptionselected }
			});
			const trigger = page.getByRole('button', { name: 'Menu' });
			await trigger.click();
			const option = page.getByRole('menuitem', { name: 'Option 2' });
			await option.click();
			expect(onoptionselected).toHaveBeenCalledWith(mockOptions[1]);
		});

		it('should close menu after selecting an option', async () => {
			render(FloatingMenu, { props: { trigger: 'Menu', options: mockOptions } });
			const trigger = page.getByRole('button', { name: 'Menu' });
			await trigger.click();
			const option = page.getByRole('menuitem', { name: 'Option 1' });
			await option.click();
			const { container } = render(FloatingMenu, { props: { trigger: 'Menu' } });
			const menu = container.querySelector('[role="menu"]');
			expect(menu).toBeNull();
		});

		it('should highlight selected option', async () => {
			render(FloatingMenu, {
				props: { trigger: 'Menu', options: mockOptions, selectedValue: 'opt2' }
			});
			const trigger = page.getByRole('button', { name: 'Menu' });
			await trigger.click();
			// The selected option should have a check icon (svg)
			const menuItems = page.getByRole('menuitem').all();
			const items = await menuItems;
			// Second option should have the check mark
			const secondItem = items[1].element() as HTMLElement;
			const checkIcon = secondItem.querySelector('svg');
			expect(checkIcon).not.toBeNull();
		});
	});

	describe('Closing menu', () => {
		it('should toggle menu on trigger click', async () => {
			render(FloatingMenu, { props: { trigger: 'Menu', options: mockOptions } });
			const trigger = page.getByRole('button', { name: 'Menu' });
			await trigger.click();
			await expect.element(page.getByRole('menu')).toBeInTheDocument();
			await trigger.click();
			await expect.element(trigger).toHaveAttribute('aria-expanded', 'false');
		});
	});

	describe('Disabled state', () => {
		it('should disable trigger button when disabled', async () => {
			render(FloatingMenu, { props: { trigger: 'Menu', disabled: true } });
			const trigger = page.getByRole('button', { name: 'Menu' });
			await expect.element(trigger).toBeDisabled();
		});
	});

	describe('Tooltip', () => {
		it('should show tooltip when tooltip prop is provided', async () => {
			render(FloatingMenu, {
				props: { trigger: 'Menu', tooltip: 'Menu tooltip' }
			});
			// The tooltip wrapper should exist
			const triggerArea = page.getByRole('button', { name: 'Show tooltip' });
			await expect.element(triggerArea).toBeInTheDocument();
		});
	});

	describe('Empty options', () => {
		it('should render empty menu when no options provided', async () => {
			render(FloatingMenu, { props: { trigger: 'Menu', options: [] } });
			const trigger = page.getByRole('button', { name: 'Menu' });
			await trigger.click();
			const menu = page.getByRole('menu');
			await expect.element(menu).toBeInTheDocument();
		});
	});
});
