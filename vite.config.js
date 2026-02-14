import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { playwright } from '@vitest/browser-playwright';

const host = process.env.TAURI_DEV_HOST;
const isCi = process.env.CI === 'true';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	build: {
		minify: 'esbuild',
		target: 'esnext',
		reportCompressedSize: false,
		sourcemap: !isCi,
		chunkSizeWarningLimit: 2000,
		rollupOptions: {
			output: {
				manualChunks: isCi
					? undefined
					: {
							vendor: ['svelte']
						}
			}
		}
	},

	esbuild: {
		drop: isCi ? ['console', 'debugger'] : [],
		legalComments: 'none'
	},

	optimizeDeps: {
		include: ['@tauri-apps/api']
	},

	// Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
	//
	// 1. prevent vite from obscuring rust errors
	clearScreen: false,
	// 2. tauri expects a fixed port, fail if that port is not available
	server: {
		port: 5293,
		strictPort: true,
		host: host || false,
		hmr: host
			? {
					protocol: 'ws',
					host,
					port: 1421
				}
			: undefined,
		watch: {
			// 3. tell vite to ignore watching `src-tauri`
			ignored: ['**/src-tauri/**']
		}
	},
	resolve: process.env.VITEST
		? {
				conditions: ['browser']
			}
		: undefined,

	// Vitest multi-project configuration
	test: {
		projects: [
			{
				// Client-side component tests (run in real browser via Playwright)
				extends: true,
				test: {
					name: 'client',
					testTimeout: 5000,
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium' }]
					},
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					setupFiles: ['./src/vitest-setup-client.ts']
				}
			},
			{
				// Unit tests (Node.js environment)
				extends: true,
				test: {
					name: 'unit',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
				}
			}
		]
	}
});
