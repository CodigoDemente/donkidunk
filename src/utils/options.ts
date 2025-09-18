export type Option = {
	value: string | number;
	label: string;
};
export const typeOptions: Option[] = [
	{
		value: 'FIXED',
		label: 'Fixed'
	},
	{
		value: 'DYNAMIC',
		label: 'Dynamic'
	}
];

export const secondsOptions: Option[] = [1, 2, 3, 4, 5].map((num) => {
	return {
		value: num,
		label: `${num}s`
	};
});
