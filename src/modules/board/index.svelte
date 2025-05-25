<script lang="ts">
	import { boardStore } from '../../persistence/stores/board/store.svelte';
	import { boardActions } from '../../persistence/stores/board/actions';

	export const checkTime: () => void = () => {};

	let showAddEventCategory = false;
	let newEventCategoryName = '';
	let newEventCategoryColor = '#ffffff';

	let showAddButtonBox: string | null = null; // holds category id or null
	let newButtonName = '';

	function openAddEventCategoryBox() {
		showAddEventCategory = true;
		newEventCategoryName = '';
		newEventCategoryColor = '#ffffff';
	}

	function openAddButtonBox(categoryId: string) {
		showAddButtonBox = categoryId;
		newButtonName = '';
	}
</script>

<div class="flex min-h-screen flex-col gap-4 bg-gray-900 p-2">
	<!-- Editing Mode Toggle -->
	<div class="mb-2 flex items-center gap-2">
		<label for="mode-toggle-play" class="text-xs font-semibold text-white">Mode:</label>
		<div class="toggle-edit-play">
			<button
				id="mode-toggle-play"
				class="toggle-btn {boardStore.isEditing ? '' : 'active'}"
				on:click={() => boardActions.setEditingMode(false)}
				aria-label="Play Mode"
			>
				▶️ Play
			</button>
			<button
				id="mode-toggle-edit"
				class="toggle-btn {boardStore.isEditing ? 'active' : ''}"
				on:click={() => boardActions.setEditingMode(true)}
				aria-label="Edit Mode"
			>
				✏️ Edit
			</button>
		</div>
	</div>

	<!-- Events Section -->
	<div class="board">
		<p class="text-xs text-white">Events Board</p>
		<button class="plus-button absolute top-2 right-2" on:click={openAddEventCategoryBox}>+</button>
		{#if showAddEventCategory}
			<div class="add-category-modal">
				<input
					type="text"
					bind:value={newEventCategoryName}
					placeholder="Category Name"
					class="mb-2 block text-xs"
				/>
				<input type="color" bind:value={newEventCategoryColor} class="mb-2" />
				<button
					class="w-full rounded bg-orange-500 px-2 py-1 text-white"
					on:click={() => {
						boardActions.addCategory(
							'eventCategories',
							newEventCategoryName,
							newEventCategoryColor
						);
						showAddEventCategory = false;
					}}
				>
					Add
				</button>
				<button
					class="mt-1 w-full text-xs text-gray-400"
					on:click={() => (showAddEventCategory = false)}
				>
					Cancel
				</button>
			</div>
		{/if}
		<div class="categories-container">
			{#each boardStore.eventCategories as category (category.id)}
				<div class="category" style="--color: {category.color}; position: relative;">
					<input
						type="text"
						bind:value={category.name}
						disabled={!boardStore.isEditing}
						placeholder="Category Name"
						class="text-xs"
					/>
					<input type="color" bind:value={category.color} class="mt-2" />
					<button class="plus-button mt-2" on:click={() => openAddButtonBox(category.id)}>+</button>
					{#if showAddButtonBox === category.id}
						<div class="add-category-modal" style="top: 40px; right: 0;">
							<input
								type="text"
								bind:value={newButtonName}
								placeholder="Button Name"
								class="mb-2 block text-xs"
							/>
							<button
								class="w-full rounded bg-orange-500 px-2 py-1 text-white"
								on:click={() => {
									boardActions.addButtonToCategory('eventCategories', category.id, newButtonName);
									showAddButtonBox = null;
									newButtonName = '';
								}}
							>
								Add
							</button>
							<button
								class="mt-1 w-full text-xs text-gray-400"
								on:click={() => (showAddButtonBox = null)}
							>
								Cancel
							</button>
						</div>
					{/if}
					<div>
						{#each category.buttons as button (button.id)}
							<button class="mt-1 rounded bg-gray-700 p-1 text-xs text-white">
								{button.name}
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>

	<!-- Tags Section -->
	<div class="board">
		<p class="text-xs text-white">Tags Board</p>
		{#each boardStore.tagsRelatedToEvents as tag (tag.id)}
			<div class="m-1 inline-block rounded px-2 py-1" style="background: {tag.color}; color: #222;">
				{tag.name}
			</div>
		{/each}
	</div>

	<!-- Actions Section -->
	<div class="board">
		<p class="text-xs text-white">Actions Board</p>
		<button
			class="plus-button"
			on:click={openAddEventCategoryBox}
			style="position: absolute; top: 8px; right: 8px;">+</button
		>
		{#if showAddEventCategory}
			<div class="add-category-modal">
				<input
					type="text"
					bind:value={newEventCategoryName}
					placeholder="Category Name"
					class="mb-2 block text-xs"
				/>
				<input type="color" bind:value={newEventCategoryColor} class="mb-2" />
				<button
					class="w-full rounded bg-orange-500 px-2 py-1 text-white"
					on:click={() => {
						boardActions.addCategory(
							'actionCategories',
							newEventCategoryName,
							newEventCategoryColor
						);
						showAddEventCategory = false;
					}}
				>
					Add
				</button>
				<button
					class="mt-1 w-full text-xs text-gray-400"
					on:click={() => (showAddEventCategory = false)}
				>
					Cancel
				</button>
			</div>
		{/if}
		<div class="categories-container">
			{#each boardStore.actionCategories as category (category.id)}
				<div class="category" style="--color: {category.color}; position: relative;">
					<input
						type="text"
						bind:value={category.name}
						placeholder="Category Name"
						class="text-xs"
					/>
					<input type="color" bind:value={category.color} class="mt-2" />
					<button class="plus-button mt-2" on:click={() => openAddButtonBox(category.id)}>+</button>
					{#if showAddButtonBox === category.id}
						<div class="add-category-modal" style="top: 40px; right: 0;">
							<input
								type="text"
								bind:value={newButtonName}
								placeholder="Button Name"
								class="mb-2 block text-xs"
							/>
							<button
								class="w-full rounded bg-orange-500 px-2 py-1 text-white"
								on:click={() => {
									boardActions.addButtonToCategory('actionCategories', category.id, newButtonName);
									showAddButtonBox = null;
									newButtonName = '';
								}}
							>
								Add
							</button>
							<button
								class="mt-1 w-full text-xs text-gray-400"
								on:click={() => (showAddButtonBox = null)}
							>
								Cancel
							</button>
						</div>
					{/if}
					<div>
						{#each category.buttons as button (button.id)}
							<button class="mt-1 rounded bg-gray-700 p-1 text-xs text-white">
								{button.name}
							</button>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<style>
	.toggle-edit-play {
		display: flex;
		border-radius: 9999px;
		overflow: hidden;
		background: #222;
	}
	.toggle-btn {
		padding: 0.25rem 1rem;
		background: none;
		border: none;
		color: #fff;
		font-size: 0.9rem;
		cursor: pointer;
		transition:
			background 0.2s,
			color 0.2s;
	}
	.toggle-btn.active {
		background: #ed8936;
		color: #222;
		font-weight: bold;
	}
	.board {
		position: relative;
		background-color: #2d3748; /* bg-gray-800 */
		border: 1px solid #4a5568; /* border-gray-700 */
		border-radius: 8px;
		padding: 16px;
		min-height: 200px;
	}
	.categories-container {
		display: flex;
		flex-wrap: wrap;
		gap: 16px;
		margin-top: 24px;
	}
	.category {
		background-color: var(--color, #ffffff);
		border: 1px solid #4a5568;
		border-radius: 8px;
		padding: 8px;
		min-width: 160px;
		max-width: 200px;
	}
	.plus-button {
		background-color: #ed8936; /* orange */
		color: #ffffff;
		border: none;
		border-radius: 50%;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
	}

	.add-category-modal {
		position: absolute;
		top: 40px;
		right: 16px;
		background: #222;
		border: 1px solid #4a5568;
		border-radius: 8px;
		padding: 16px;
		z-index: 10;
		width: 180px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
	}
</style>
