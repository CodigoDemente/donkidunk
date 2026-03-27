import type { Button } from '../board/types/Button';
import type { Tag } from '../board/types/Tag';
import type { RangeDataWithTags } from '../videoplayer/types/RangeData';

/**
 * Event buttons that appear on the timeline at least once (board metadata + timeline intersection).
 */
export function getEventButtonsForExport(
	eventTimeline: RangeDataWithTags[],
	eventButtonsById: Record<string, Button>
): Button[] {
	const seen = new Set<string>();
	const buttons: Button[] = [];

	for (const event of eventTimeline) {
		const id = event.buttonId;
		if (seen.has(id)) {
			continue;
		}
		seen.add(id);
		const btn = eventButtonsById[id];
		if (btn) {
			buttons.push(btn);
		}
	}

	return buttons.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
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
