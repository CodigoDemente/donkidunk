/// <reference types="vitest/browser" />
/// <reference types="@vitest/browser-playwright" />

// Mock Tauri IPC internals so @tauri-apps/api modules don't fail in the browser test environment
if (typeof window !== 'undefined' && !('__TAURI_INTERNALS__' in window)) {
	Object.defineProperty(window, '__TAURI_INTERNALS__', {
		value: {
			invoke: async () => {},
			transformCallback: () => 0,
			convertFileSrc: (src: string) => src,
			metadata: {
				currentWindow: { label: 'main' },
				currentWebview: { label: 'main' }
			},
			plugins: {}
		},
		writable: true,
		configurable: true
	});
}
