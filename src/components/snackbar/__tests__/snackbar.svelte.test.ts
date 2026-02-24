import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import Snackbar from '../snackbar.svelte';

// Mock the projectActions module
vi.mock('../../../persistence/stores/project/actions', () => ({
	projectActions: {
		hideSnackbar: vi.fn()
	}
}));

function createSnackbarStore(
	overrides: Partial<{
		title: string;
		message: string;
		type: 'info' | 'error' | 'success' | 'warning';
		show: boolean;
		mode: 'auto' | 'manual';
	}> = {}
) {
	return {
		title: '',
		message: '',
		type: 'info' as const,
		show: false,
		mode: 'manual' as const,
		...overrides
	};
}

describe('Snackbar Component', () => {
	describe('Visibility', () => {
		it('should not render when show is false', async () => {
			const store = createSnackbarStore({ show: false, message: 'Hidden' });
			const { container } = render(Snackbar, { props: { snackbarStore: store } });
			expect(container.querySelector('.fixed')).toBeNull();
		});

		it('should render when show is true', async () => {
			const store = createSnackbarStore({ show: true, message: 'Visible' });
			render(Snackbar, { props: { snackbarStore: store } });
			await expect.element(page.getByText('Visible')).toBeInTheDocument();
		});
	});

	describe('Content', () => {
		it('should display the title when provided', async () => {
			const store = createSnackbarStore({ show: true, title: 'Alert Title' });
			render(Snackbar, { props: { snackbarStore: store } });
			await expect.element(page.getByText('Alert Title')).toBeInTheDocument();
		});

		it('should display the message when provided', async () => {
			const store = createSnackbarStore({ show: true, message: 'Something happened' });
			render(Snackbar, { props: { snackbarStore: store } });
			await expect.element(page.getByText('Something happened')).toBeInTheDocument();
		});

		it('should display both title and message', async () => {
			const store = createSnackbarStore({
				show: true,
				title: 'Success!',
				message: 'Operation completed.'
			});
			render(Snackbar, { props: { snackbarStore: store } });
			await expect.element(page.getByText('Success!')).toBeInTheDocument();
			await expect.element(page.getByText('Operation completed.')).toBeInTheDocument();
		});

		it('should not display title when empty', async () => {
			const store = createSnackbarStore({ show: true, message: 'No title' });
			const { container } = render(Snackbar, { props: { snackbarStore: store } });
			const titleEl = container.querySelector('.font-semibold');
			expect(titleEl).toBeNull();
		});
	});

	describe('Types and styling', () => {
		it('should apply success background', async () => {
			const store = createSnackbarStore({ show: true, type: 'success', message: 'Done' });
			const { container } = render(Snackbar, { props: { snackbarStore: store } });
			const snackbar = container.querySelector('.bg-green-200\\/90');
			expect(snackbar).not.toBeNull();
		});

		it('should apply error background', async () => {
			const store = createSnackbarStore({ show: true, type: 'error', message: 'Failed' });
			const { container } = render(Snackbar, { props: { snackbarStore: store } });
			const snackbar = container.querySelector('.bg-red-200\\/90');
			expect(snackbar).not.toBeNull();
		});

		it('should apply info background', async () => {
			const store = createSnackbarStore({ show: true, type: 'info', message: 'Info' });
			const { container } = render(Snackbar, { props: { snackbarStore: store } });
			const snackbar = container.querySelector('.bg-blue-200\\/90');
			expect(snackbar).not.toBeNull();
		});

		it('should apply warning background', async () => {
			const store = createSnackbarStore({ show: true, type: 'warning', message: 'Warning' });
			const { container } = render(Snackbar, { props: { snackbarStore: store } });
			const snackbar = container.querySelector('.bg-yellow-200\\/90');
			expect(snackbar).not.toBeNull();
		});

		it('should apply success text color', async () => {
			const store = createSnackbarStore({
				show: true,
				type: 'success',
				message: 'Green text'
			});
			const { container } = render(Snackbar, { props: { snackbarStore: store } });
			const textEl = container.querySelector('.text-green-800');
			expect(textEl).not.toBeNull();
		});

		it('should apply error text color', async () => {
			const store = createSnackbarStore({
				show: true,
				type: 'error',
				message: 'Red text'
			});
			const { container } = render(Snackbar, { props: { snackbarStore: store } });
			const textEl = container.querySelector('.text-red-800');
			expect(textEl).not.toBeNull();
		});
	});

	describe('Close button', () => {
		it('should render a close button', async () => {
			const store = createSnackbarStore({ show: true, message: 'Closeable' });
			render(Snackbar, { props: { snackbarStore: store } });
			const closeBtn = page.getByRole('button', { name: 'Close' });
			await expect.element(closeBtn).toBeInTheDocument();
		});
	});
});
