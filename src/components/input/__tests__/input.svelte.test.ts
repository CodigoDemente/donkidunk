import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Input from '../input.svelte';

describe('Input Component', () => {
	describe('Rendering', () => {
		it('should render an input element', async () => {
			render(Input, { props: { value: '' } });
			const input = page.getByRole('textbox');
			await expect.element(input).toBeInTheDocument();
		});

		it('should render with the given value', async () => {
			render(Input, { props: { value: 'Hello World' } });
			const input = page.getByRole('textbox');
			await expect.element(input).toHaveValue('Hello World');
		});

		it('should render label when provided', async () => {
			render(Input, { props: { value: '', label: 'Username' } });
			await expect.element(page.getByText('Username')).toBeInTheDocument();
		});

		it('should not render label when not provided', async () => {
			const { container } = render(Input, { props: { value: '' } });
			const label = container.querySelector('p');
			expect(label).toBeNull();
		});

		it('should render placeholder', async () => {
			render(Input, { props: { value: '', placeholder: 'Enter your name' } });
			const input = page.getByRole('textbox');
			await expect.element(input).toHaveAttribute('placeholder', 'Enter your name');
		});

		it('should apply the id attribute', async () => {
			render(Input, { props: { value: '', id: 'my-input' } });
			const input = page.getByRole('textbox');
			await expect.element(input).toHaveAttribute('id', 'my-input');
		});

		it('should apply the name attribute', async () => {
			render(Input, { props: { value: '', name: 'username' } });
			const input = page.getByRole('textbox');
			await expect.element(input).toHaveAttribute('name', 'username');
		});
	});

	describe('Sizes', () => {
		it('should apply large size class by default', async () => {
			const { container } = render(Input, { props: { value: '' } });
			const label = container.querySelector('label');
			expect(label?.classList.contains('w-72')).toBe(true);
		});

		it('should apply mini size class', async () => {
			const { container } = render(Input, { props: { value: '', size: 'mini' } });
			const label = container.querySelector('label');
			expect(label?.classList.contains('w-18')).toBe(true);
		});

		it('should apply small size class', async () => {
			const { container } = render(Input, { props: { value: '', size: 'small' } });
			const label = container.querySelector('label');
			expect(label?.classList.contains('w-28')).toBe(true);
		});

		it('should apply medium size class', async () => {
			const { container } = render(Input, { props: { value: '', size: 'medium' } });
			const label = container.querySelector('label');
			expect(label?.classList.contains('w-46')).toBe(true);
		});

		it('should apply full size class', async () => {
			const { container } = render(Input, { props: { value: '', size: 'full' } });
			const label = container.querySelector('label');
			expect(label?.classList.contains('w-full')).toBe(true);
		});
	});

	describe('Error and Warning', () => {
		it('should render error message', async () => {
			render(Input, { props: { value: '', error: 'This field is required' } });
			await expect.element(page.getByText('This field is required')).toBeInTheDocument();
		});

		it('should render error in red', async () => {
			const { container } = render(Input, {
				props: { value: '', error: 'Error message' }
			});
			const errorEl = container.querySelector('.text-red-400');
			expect(errorEl).not.toBeNull();
			expect(errorEl?.textContent).toBe('Error message');
		});

		it('should render warning message', async () => {
			render(Input, { props: { value: '', warning: 'Check your input' } });
			await expect.element(page.getByText('Check your input')).toBeInTheDocument();
		});

		it('should render warning in yellow', async () => {
			const { container } = render(Input, {
				props: { value: '', warning: 'Warning message' }
			});
			const warningEl = container.querySelector('.text-yellow-400');
			expect(warningEl).not.toBeNull();
			expect(warningEl?.textContent).toBe('Warning message');
		});
	});

	describe('States', () => {
		it('should be disabled when disabled prop is true', async () => {
			render(Input, { props: { value: '', disabled: true } });
			const input = page.getByRole('textbox');
			await expect.element(input).toBeDisabled();
		});

		it('should be readonly when readonly prop is true', async () => {
			render(Input, { props: { value: 'readonly', readonly: true } });
			const input = page.getByRole('textbox');
			await expect.element(input).toHaveAttribute('readonly');
		});

		it('should be required when required prop is true', async () => {
			render(Input, { props: { value: '', required: true } });
			const input = page.getByRole('textbox');
			await expect.element(input).toHaveAttribute('required');
		});
	});

	describe('Layout', () => {
		it('should be vertical by default', async () => {
			const { container } = render(Input, {
				props: { value: '', label: 'Test' }
			});
			const label = container.querySelector('label');
			expect(label?.classList.contains('flex-col')).toBe(true);
		});

		it('should be horizontal when horizontal prop is true', async () => {
			const { container } = render(Input, {
				props: { value: '', label: 'Test', horizontal: true }
			});
			const label = container.querySelector('label');
			expect(label?.classList.contains('flex-row')).toBe(true);
		});
	});
});
