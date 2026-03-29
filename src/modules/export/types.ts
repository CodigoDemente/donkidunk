import type { CategoryType } from '../board/types/CategoryType';

export type ExportingRule = {
	type: CategoryType;
	include: string;
	taggedWith: string[];
	temp: boolean;
};

export type ExportClipTag = {
	id: string;
	name: string;
	color: string;
};

export type GalleryClip = {
	index: number;
	timestamps: [number, number];
	buttonId: string;
	buttonName: string;
	buttonColor: string;
	categoryName: string;
	tags: ExportClipTag[];
};

/** Same shape as gallery clips (cards, timeline, preview). */
export type ExportClip = GalleryClip & {
	/** Optional display title; falls back to `buttonName` in UI. */
	title?: string;
};

export type ExportContextState = {
	rules: ExportingRule[];
	galleryClips: GalleryClip[];
	exporting: boolean;
	exportProgress: number;
};
