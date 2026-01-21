<script lang="ts">
	import Input from '../../../components/input/input.svelte';
	import Button from '../../../components/button/button.svelte';
	import { selectVideoFile } from '../../menu/operations/selectVideoFile';
	import { projectActions } from '../../../persistence/stores/project/actions';

	let videoPath = $state('');

	$effect(() => {
		projectActions.setReplaceVideoFormData(videoPath);
	});

	async function handleSelectVideoFile() {
		const path = await selectVideoFile();

		if (path) {
			videoPath = path;
		}
	}
</script>

<div class="flex w-full flex-col gap-10 px-4 pt-4 pb-8">
	<p class="border-b border-gray-500 text-sm text-gray-200">
		⚠️ The video file you are trying to open does not exist. Please select a new video file.
	</p>
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
</div>
