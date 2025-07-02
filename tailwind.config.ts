import typography from '@tailwindcss/typography';
import colors from 'tailwindcss/colors';
import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		colors: {
			transparent: 'transparent',
			current: 'currentColor',
			black: colors.black,
			white: colors.white,
			gray: colors.slate,
			green: colors.emerald,
			yellow: colors.amber,
			purple: colors.fuchsia
		},
		extend: {
			fontFamily: {
				sans: ["'Source Sans Pro'", 'Inter', 'sans-serif'],
				mono: ["'Fira Code'", 'monospace']
			}
		}
	},

	plugins: [typography]
} satisfies Config;
