<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { RouteId } from '$app/types';
	import { IconEdit, IconHome, IconLayoutBoard, IconPlayerPlay } from '@tabler/icons-svelte';
	import Floatingmenu from '../../components/floatingmenu/floatingmenu.svelte';
	import { UIMode } from '../config/types/Config';
	import { configContext } from '../config/context.svelte';
	import type { FloatingMenuOption } from '../../components/floatingmenu/types';
	import { saveUIModeCommand } from '../config/commands/SaveUIMode';
	import { boardContext } from '../board/context.svelte';
	import Tooltip from '../../components/tooltip/tooltip.svelte';

	type Props = {
		disabled: boolean;
	};

	let { disabled }: Props = $props();

	const config = configContext.get();
	const board = boardContext.get();

	function navigateTo(page: RouteId) {
		goto(resolve(page)); // Navigate to the specified route
	}

	const isActive = (pageRoute: RouteId) => {
		return page.route.id === pageRoute;
	};

	const floatingmenuOptions = [
		{
			id: '1',
			value: UIMode.Simple.toString(),
			label: 'Beginner'
		},
		{
			id: '2',
			value: UIMode.Advanced.toString(),
			label: 'Professional'
		}
	];

	async function handleUIModeChange(option: FloatingMenuOption): Promise<void> {
		config.uiMode = Number(option.value) as UIMode;

		await saveUIModeCommand(config.uiMode);
	}

	function toggleEditingMode(): void {
		const value = !board.isEditing;
		board.setEditingMode(value);
	}
</script>

<navbar class="my-0.5 bg-gray-900 px-4">
	<ul class="flex flex-row items-center">
		<li>
			<button
				class={`
				${disabled ? 'cursor-not-allowed opacity-50' : 'hover:cursor-pointer '}
				${isActive('/') ? 'bg-tertiary text-white' : 'text-tertiary'}
				flex items-center justify-center gap-2 rounded-sm 
				p-1.5`}
				type="button"
				{disabled}
				onclick={() => navigateTo('/')}
			>
				<IconHome class="mr-0.5 h-3 w-3" />
			</button>
		</li>
		<li>
			<button
				class={`
				${disabled ? 'cursor-not-allowed opacity-50' : 'hover:cursor-pointer'}
				${isActive('/export') ? 'bg-tertiary text-white' : 'text-tertiary'}
				flex items-center justify-center gap-2 rounded-sm p-1.5`}
				type="button"
				{disabled}
				onclick={() => navigateTo('/export')}
			>
				<span class="h-3 text-xs">Export</span>
			</button>
		</li>
		<li>
			<button
				class={`
					${disabled ? 'cursor-not-allowed opacity-50' : 'hover:cursor-pointer'}
					${isActive('/metrics') ? 'bg-tertiary text-white' : 'text-tertiary'}
					flex items-center justify-center gap-2 rounded-sm p-1.5`}
				type="button"
				{disabled}
				onclick={() => navigateTo('/metrics')}
			>
				<span class="h-3 text-xs">Metrics</span>
			</button>
		</li>
		<!-- 
		This is commented out because this route doesn't exists yet and eslint complains about it
		<li>
			<button type="button" onclick={() => navigateTo('/graphics')}>Graphics</button>
		</li> 
		-->

		<li class="ml-auto">
			<Tooltip text={board.isEditing ? 'Edit Mode' : 'Play Mode'} size="small" position="bottom">
				<button
					type="button"
					class={`
				${disabled ? 'cursor-not-allowed opacity-50' : 'hover:cursor-pointer'}
				${board.isEditing ? 'bg-tertiary text-white' : 'text-tertiary'}
				flex items-center justify-center gap-2 rounded-sm p-1.5`}
					onclick={() => toggleEditingMode()}
					aria-label="Edit"
					{disabled}
				>
					{#if board.isEditing}
						<IconEdit class="h-4 w-4" />
					{:else}
						<IconPlayerPlay class="h-4 w-4" />
					{/if}
				</button>
			</Tooltip>
		</li>

		<li>
			<Floatingmenu
				trigger={IconLayoutBoard}
				options={floatingmenuOptions}
				selectedValue={config.uiMode.toString()}
				onoptionselected={handleUIModeChange}
				triggerClass="text-tertiary hover:cursor-pointer"
				iconClass="h-4 w-4"
				tooltip="Layout Mode"
				{disabled}
			/>
		</li>
	</ul>
</navbar>
