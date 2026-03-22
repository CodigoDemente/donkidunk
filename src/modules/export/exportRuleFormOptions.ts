import type { Button } from '../board/types/Button';
import type { Tag } from '../board/types/Tag';
import type { RangeDataWithTags } from '../videoplayer/types/RangeData';

/**
 * All event buttons from the board (for choosing which event type to export).
 */
export function getEventButtonsForExport(eventButtonsById: Record<string, Button>): Button[] {
	return Object.values(eventButtonsById).sort((a, b) =>
		a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
	);
}

/**
 * Tags that appear on timeline events for the selected button only, resolved to full Tag rows from the board.
 */
export function getTagsForSelectedButton(
	eventTimeline: RangeDataWithTags[],
	tagsById: Record<string, Tag>,
	selectedButtonId: string
): Tag[] {
	if (!selectedButtonId) {
		return [];
	}

	const seen = new Set<string>();
	const orderedIds: string[] = [];

	for (const event of eventTimeline) {
		if (event.buttonId !== selectedButtonId) {
			continue;
		}
		for (const tagId of event.tagsRelated) {
			if (!seen.has(tagId)) {
				seen.add(tagId);
				orderedIds.push(tagId);
			}
		}
	}

	return orderedIds.map((id) => tagsById[id]).filter((t): t is Tag => t != null);
}
