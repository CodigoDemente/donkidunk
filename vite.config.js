import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';

const host = process.env.TAURI_DEV_HOST;
const isCi = process.env.CI === 'true';

/** @returns {Promise<import('vite').UserConfig>} */
async function config() {
	return {
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
			port: 1420,
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
			: undefined
	};
}

// https://vitejs.dev/config/
export default defineConfig(config());
