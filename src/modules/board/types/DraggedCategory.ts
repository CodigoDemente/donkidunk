export type DraggedCategory = {
	id: string;
	offset: {
		x: number;
		y: number;
	};
	container: {
		width: number;
		height: number;
	};
};
