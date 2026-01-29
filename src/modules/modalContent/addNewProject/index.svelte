<script lang="ts">
	import Input from '../../../components/input/input.svelte';
	import Button from '../../../components/button/button.svelte';
	import { projectActions } from '../../../persistence/stores/project/actions';
	import { selectProjectPath } from '../../menu/operations/selectProjectPath';
	import { selectVideoFile } from '../../menu/operations/selectVideoFile';
	import { configContext } from '../../config/context.svelte';
	import Dropdown from '../../../components/dropdown/dropdown.svelte';

	let projectPath = $state('');
	let videoPath = $state('');

	const config = configContext.get();

	let selectedBoardId = $state('empty');
	let buttonBoard = $derived(config.buttonBoards.find((b) => b.id === selectedBoardId));

	// Sync local state with projectStore
	$effect(() => {
		projectActions.setNewProjectFormData({
			projectPath,
			videoPath,
			buttonBoard: buttonBoard!
		});
	});

	async function handleSelectProjectPath() {
		const path = await selectProjectPath();

		if (path) {
			projectPath = path;
		}
	}

	async function handleSelectVideoFile() {
		const path = await selectVideoFile();

		if (path) {
			videoPath = path;
		}
	}
</script>

<div class="flex w-full flex-col gap-10 px-4 pt-4 pb-8">
	<p class="border-b border-gray-500 text-sm text-gray-200">
		To create a new project, indicate where you will save the file and the video to import:
	</p>
	<div class="flex w-full items-end gap-2">
		<Input
			label="Project path"
			placeholder="Select where to save the project..."
			type="text"
			readonly
			bind:value={projectPath}
			size="large"
			inputClass="bg-gray-700"
			noErrors
		/>
		<Button tertiary onClick={handleSelectProjectPath} size="small">Browse</Button>
	</div>

	<div class="flex items-end gap-2">
		<Input
			label="Video file"
			placeholder="Select video file to import..."
			type="text"
			readonly
			bind:value={videoPath}
			size="large"
			inputClass="bg-gray-700"
			noErrors
		/>
		<Button tertiary onClick={handleSelectVideoFile} size="small">Browse</Button>
	</div>

	<div class="flex items-end gap-2">
		<Dropdown
			label="Board"
			options={[
				{
					label: 'Empty board',
					value: 'empty'
				},
				...config.buttonBoards.map((buttonBoard) => ({
					label: buttonBoard.name,
					value: buttonBoard.id
				}))
			]}
			bind:value={selectedBoardId}
			size="large"
			selectClass="bg-gray-700"
			noErrors
			horizontal
		/>
	</div>
</div>
