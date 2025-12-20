import type { Icon } from '@tabler/icons-svelte';

export interface FloatingMenuOption {
	id: string;
	value: string;
	label: string;
}

export interface Props {
	/** The trigger element - can be text or a Tabler icon component */
	trigger: string | Icon;
	/** List of options to display in the menu */
	options?: FloatingMenuOption[];
	/** Currently selected value (for visual feedback) */
	selectedValue?: string;
	/** Callback fired when an option is selected */
	onoptionselected?: (option: FloatingMenuOption) => void;
	/** Custom class for the trigger button */
	triggerClass?: string;
	/** Custom class for the trigger icon (only applies when trigger is an Icon) */
	iconClass?: string;
	/** Custom class for the menu container */
	menuClass?: string;
	/** Whether the menu is disabled */
	disabled?: boolean;
	/** Tooltip text to show on hover */
	tooltip?: string;
}
