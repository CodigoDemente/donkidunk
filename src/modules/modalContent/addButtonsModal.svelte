<script lang="ts">
	type ButtonType = { name: string; type: string; duration: string };
	let categoryName = '';
	let categoryColor = '#ff9900';
	let buttons: ButtonType[] = [];
	let newButton = { name: '', type: '', duration: '' };

	function addButton() {
		if (newButton.name) {
			buttons = [...buttons, { ...newButton }];
			newButton = { name: '', type: '', duration: '' };
		}
	}

	function removeButton(idx: number) {
		buttons = buttons.filter((_, i) => i !== idx);
	}
</script>

<div class="flex flex-1 flex-col gap-4 p-4">
	<!-- Category Name -->
	<div>
		<div class="mb-4 border-b border-gray-700">
			<span class="text-xs text-gray-100">Category settings</span>
		</div>
		<label class="mb-4 flex items-center gap-4 text-sm text-white">
			<p class="w-[120px]">Name</p>
			<input
				class="rounded bg-gray-700 px-2 py-1 text-white"
				bind:value={categoryName}
				placeholder="Enter category name"
			/>
		</label>
		<!-- Color Selector -->
		<label class="flex items-center gap-4 text-sm text-white">
			<p class="w-[120px]">Color</p>
			<div>
				<input type="color" bind:value={categoryColor} class="h-8 w-8 border-0 bg-transparent" />
				<span class="ml-2">{categoryColor}</span>
			</div>
		</label>
	</div>
	<!-- Buttons Table -->
	<div>
		<div class="mb-4 border-b border-gray-700">
			<span class="text-xs text-gray-100">Button settings</span>
		</div>
		<table class="w-full rounded bg-gray-700 text-xs text-white">
			<thead>
				<tr>
					<th class="p-2 text-left">Name</th>
					<th class="p-2 text-left">Type</th>
					<th class="p-2 text-left">Duration</th>
					<th class="p-2"></th>
				</tr>
			</thead>
			<tbody>
				{#each buttons as btn, idx}
					<tr>
						<td class="p-2">{btn.name}</td>
						<td class="p-2">{btn.type}</td>
						<td class="p-2">{btn.duration}</td>
						<td class="p-2">
							<button class="text-red-400 hover:text-red-600" on:click={() => removeButton(idx)}
								>&times;</button
							>
						</td>
					</tr>
				{/each}
				<tr>
					<td class="p-2">
						<input
							class="w-full rounded bg-gray-800 px-1 py-0.5 text-white"
							bind:value={newButton.name}
							placeholder="Name"
						/>
					</td>
					<td class="p-2">
						<input
							class="w-full rounded bg-gray-800 px-1 py-0.5 text-white"
							bind:value={newButton.type}
							placeholder="Type"
						/>
					</td>
					<td class="p-2">
						<input
							class="w-full rounded bg-gray-800 px-1 py-0.5 text-white"
							bind:value={newButton.duration}
							placeholder="Duration"
						/>
					</td>
					<td class="p-2">
						<button class="text-green-400 hover:text-green-600" on:click={addButton}>+</button>
					</td>
				</tr>
			</tbody>
		</table>
	</div>
</div>
