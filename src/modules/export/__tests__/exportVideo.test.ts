/**
 * Tests for the exportVideo operation (operations/exportVideo.ts).
 *
 * All external dependencies (Tauri APIs, stores, commands) are mocked.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest';
import type { TimelineRepository } from '../../../ports/TimelineRepository';
import type { ExportingRule } from '../types';
import { CategoryType } from '../../board/types/CategoryType';

// ─── Mocks ───────────────────────────────────────────────────────────────────

const { mockCutVideo, mockSave, mockDirname, mockDebug, mockLogError } = vi.hoisted(() => ({
	mockCutVideo: vi.fn().mockResolvedValue(undefined),
	mockSave: vi.fn().mockResolvedValue('/output/video.mp4'),
	mockDirname: vi.fn().mockResolvedValue('/input/folder'),
	mockDebug: vi.fn(),
	mockLogError: vi.fn()
}));

// Mock @tauri-apps/api/core to avoid window dependency from Channel
vi.mock('@tauri-apps/api/core', () => ({
	Channel: class MockChannel {
		onmessage: ((msg: unknown) => void) | null = null;
	},
	invoke: vi.fn()
}));

vi.mock('../commands/CutVideo', () => ({
	cutVideo: mockCutVideo
}));

vi.mock('@tauri-apps/plugin-dialog', () => ({
	save: mockSave
}));

vi.mock('@tauri-apps/api', () => ({
	path: {
		dirname: mockDirname
	}
}));

vi.mock('@tauri-apps/plugin-log', () => ({
	debug: mockDebug,
	error: mockLogError
}));

vi.mock('../../../persistence/stores/export/actions', () => ({
	exportActions: {
		setExporting: vi.fn(),
		setExportProgress: vi.fn()
	}
}));

vi.mock('../../../persistence/stores/project/actions', () => ({
	projectActions: {
		setSnackbar: vi.fn()
	}
}));

// Import after mocks
import { exportVideo } from '../operations/exportVideo';
import { exportActions } from '../../../persistence/stores/export/actions';
import { projectActions } from '../../../persistence/stores/project/actions';

// ─── Test helpers ────────────────────────────────────────────────────────────

function createMockRepository(ranges: [number, number][] = [[0, 10]]): TimelineRepository {
	return {
		getEvents: vi.fn().mockResolvedValue([]),
		getRangesForExport: vi.fn().mockResolvedValue(ranges),
		addEntry: vi.fn().mockResolvedValue(undefined),
		updateEntry: vi.fn().mockResolvedValue(undefined),
		addTagToEntry: vi.fn().mockResolvedValue(undefined),
		removeTagFromEntry: vi.fn().mockResolvedValue(undefined),
		removeEntry: vi.fn().mockResolvedValue(undefined),
		clearAllEntries: vi.fn().mockResolvedValue(undefined)
	};
}

function createRule(overrides: Partial<ExportingRule> = {}): ExportingRule {
	return {
		type: CategoryType.Event,
		include: 'btn-1',
		taggedWith: [],
		temp: false,
		...overrides
	};
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('exportVideo', () => {
	const videoPath = '/input/video.mp4';
	let repository: TimelineRepository;

	beforeEach(() => {
		vi.clearAllMocks();
		repository = createMockRepository();
		mockSave.mockResolvedValue('/output/video.mp4');
		mockCutVideo.mockResolvedValue(undefined);
	});

	test('should initialize export state at start', async () => {
		const rules = [createRule()];

		await exportVideo(videoPath, rules, repository);

		expect(exportActions.setExporting).toHaveBeenCalledWith(false);
		expect(exportActions.setExportProgress).toHaveBeenCalledWith(0);
	});

	test('should resolve the video folder via path.dirname', async () => {
		const rules = [createRule()];

		await exportVideo(videoPath, rules, repository);

		expect(mockDirname).toHaveBeenCalledWith(videoPath);
	});

	test('should open save dialog with correct filters', async () => {
		const rules = [createRule()];

		await exportVideo(videoPath, rules, repository);

		expect(mockSave).toHaveBeenCalledWith({
			title: 'Select output video file',
			defaultPath: '/input/folder',
			filters: [{ name: 'Video', extensions: ['mp4'] }]
		});
	});

	test('should abort if user cancels the save dialog', async () => {
		mockSave.mockResolvedValueOnce(null);
		const rules = [createRule()];

		await exportVideo(videoPath, rules, repository);

		expect(mockCutVideo).not.toHaveBeenCalled();
		// Should not set exporting to true
		expect(exportActions.setExporting).toHaveBeenCalledWith(false);
		expect(exportActions.setExporting).not.toHaveBeenCalledWith(true);
	});

	test('should set exporting to true after save dialog confirms', async () => {
		const rules = [createRule()];

		await exportVideo(videoPath, rules, repository);

		expect(exportActions.setExporting).toHaveBeenCalledWith(true);
	});

	test('should get export ranges from the repository', async () => {
		const rules = [createRule({ include: 'btn-A' })];

		await exportVideo(videoPath, rules, repository);

		expect(repository.getRangesForExport).toHaveBeenCalledWith(rules);
	});

	test('should call cutVideo with correct params', async () => {
		const ranges: [number, number][] = [
			[5, 15],
			[20, 30]
		];
		repository = createMockRepository(ranges);
		const rules = [createRule()];

		await exportVideo(videoPath, rules, repository);

		expect(mockCutVideo).toHaveBeenCalledWith(
			videoPath,
			'/output/video.mp4',
			ranges,
			expect.any(Object) // Channel instance
		);
	});

	test('should show success snackbar on completion', async () => {
		const rules = [createRule()];

		await exportVideo(videoPath, rules, repository);

		expect(projectActions.setSnackbar).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'success' })
		);
	});

	test('should show error snackbar when cutVideo fails', async () => {
		mockCutVideo.mockRejectedValueOnce(new Error('ffmpeg error'));
		const rules = [createRule()];

		await exportVideo(videoPath, rules, repository);

		expect(projectActions.setSnackbar).toHaveBeenCalledWith(
			expect.objectContaining({ type: 'error' })
		);
		expect(mockLogError).toHaveBeenCalled();
	});

	test('should set exporting to false in finally block', async () => {
		const rules = [createRule()];

		await exportVideo(videoPath, rules, repository);

		// The last call to setExporting should be false (finally block)
		const calls = (exportActions.setExporting as ReturnType<typeof vi.fn>).mock.calls;
		expect(calls[calls.length - 1][0]).toBe(false);
	});

	test('should set exporting to false even when cutVideo fails', async () => {
		mockCutVideo.mockRejectedValueOnce(new Error('crash'));
		const rules = [createRule()];

		await exportVideo(videoPath, rules, repository);

		const calls = (exportActions.setExporting as ReturnType<typeof vi.fn>).mock.calls;
		expect(calls[calls.length - 1][0]).toBe(false);
	});
});
