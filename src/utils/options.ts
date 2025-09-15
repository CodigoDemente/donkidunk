export const typeOptions = [
	{
		value: 'ACTION',
		label: 'Action'
	},
	{
		value: 'EVENT',
		label: 'Event'
	}
];

export const secondsOptions = [1, 2, 3, 4, 5].map((num) => {
	return {
		value: num,
		label: `${num}s`
	};
});
