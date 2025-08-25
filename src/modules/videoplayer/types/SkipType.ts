export type SkipType = (typeof SkipType)[keyof typeof SkipType];

export const SkipType = {
	SHORT: 'short',
	LONG: 'long'
} as const;
