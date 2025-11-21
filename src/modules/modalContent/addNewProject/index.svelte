<script lang="ts">
	import Input from '../../../components/input/input.svelte';
	import Button from '../../../components/button/button.svelte';
	import { projectActions } from '../../../persistence/stores/project/actions';
	import { selectProjectPath } from '../../menu/operations/selectProjectPath';
	import { selectVideoFile } from '../../menu/operations/selectVideoFile';

	let projectPath = $state('');
	let videoPath = $state('');

	// Sync local state with projectStore
	$effect(() => {
		projectActions.setNewProjectFormData({
			projectPath,
			videoPath
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

<div class="flex flex-1 flex-col gap-4 p-4">
	<!-- Project Path -->
	<div class="flex flex-col gap-2">
		<div class="flex items-end gap-2">
			<Input
				horizontal
				label="Project Path"
				placeholder="Select where to save the project"
				type="text"
				readonly
				bind:value={projectPath}
				size="full"
				inputClass="bg-gray-700"
				noErrors
			/>
			<Button onClick={handleSelectProjectPath} size="medium">Browse</Button>
		</div>
	</div>

	<!-- Video File -->
	<div class="flex flex-col gap-2">
		<div class="flex items-end gap-2">
			<Input
				horizontal
				label="Video File"
				placeholder="Select video file to import"
				type="text"
				readonly
				bind:value={videoPath}
				size="full"
				inputClass="bg-gray-700"
				noErrors
			/>
			<Button onClick={handleSelectVideoFile} size="medium">Browse</Button>
		</div>
	</div>
</div>
