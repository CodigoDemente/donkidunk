export type ToggleProps = {
	checked: boolean;
	onChange?: (checked: boolean) => void;
	disabled?: boolean;
	className?: string;
	labelTruthy?: string;
	labelFalsy?: string;
};
