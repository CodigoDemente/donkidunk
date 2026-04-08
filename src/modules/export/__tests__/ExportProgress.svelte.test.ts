import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-svelte';
import { page } from 'vitest/browser';
import ExportProgress from '../components/ExportProgress.svelte';

vi.mock('../context.svelte', () => {
	let loading = false;
	let exportProgress = 0;

	return {
		exportContext: {
			get: () => ({
				get loading() {
					return loading;
				},
				get exportProgress() {
					return exportProgress;
				}
			}),
			__setMock(l: boolean, p: number) {
				loading = l;
				exportProgress = p;
			}
		}
	};
});

const { exportContext } = await import('../context.svelte');

describe('ExportProgress', () => {
	describe('Rendering', () => {
		it('should not render anything when not loading', async () => {
			(exportContext as any).__setMock(false, 0);
			const { container } = render(ExportProgress);
			expect(container.textContent?.trim()).toBe('');
		});

		it('should render the progress message when loading', async () => {
			(exportContext as any).__setMock(true, 0);
			render(ExportProgress);
			await expect.element(page.getByText('Exporting video, please wait...')).toBeInTheDocument();
		});

		it('should display the progress percentage', async () => {
			(exportContext as any).__setMock(true, 42);
			render(ExportProgress);
			await expect.element(page.getByText('42%')).toBeInTheDocument();
		});

		it('should render a progress bar', async () => {
			(exportContext as any).__setMock(true, 75);
			const { container } = render(ExportProgress);
			const bar = container.querySelector('[style*="width: 75%"]');
			expect(bar).not.toBeNull();
		});
	});
});
