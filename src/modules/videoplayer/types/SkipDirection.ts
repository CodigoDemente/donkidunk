export type SkipDirection = (typeof SkipDirection)[keyof typeof SkipDirection];

export const SkipDirection = {
	BACKWARD: 'backward',
	FORWARD: 'forward'
} as const;
