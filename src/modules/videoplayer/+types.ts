export type SkipDirection = (typeof SkipDirection)[keyof typeof SkipDirection];

export type SkipType = (typeof SkipType)[keyof typeof SkipType];

export const SkipType = {
	SHORT: 'short',
	LONG: 'long'
} as const;

export const SkipDirection = {
	BACKWARD: 'backward',
	FORWARD: 'forward'
} as const;
