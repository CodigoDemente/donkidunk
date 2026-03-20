<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import type { RouteId } from '$app/types';
	import { IconHome, IconLayoutBoard } from '@tabler/icons-svelte';
	import Floatingmenu from '../../components/floatingmenu/floatingmenu.svelte';
	import { UIMode } from '../config/types/Config';
	import { Config, configContext } from '../config/context.svelte';
	import type { FloatingMenuOption } from '../../components/floatingmenu/types';
	import { saveUIModeCommand } from '../config/commands/SaveUIMode';

	type Props = {
		disabled: boolean;
	};

	let { disabled }: Props = $props();

	let config: Config;

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
		if (!config) {
			config = configContext.get();
		}

		config.uiMode = Number(option.value) as UIMode;

		await saveUIModeCommand(config.uiMode);
	}
</script>

<navbar class="bg-gray-900 px-2 py-1">
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
				<IconHome class="h-4 w-4" />
			</button>
		</li>
		<li>
			<button
				class={`
				${disabled ? 'cursor-not-allowed opacity-50' : 'hover:cursor-pointer'}
				${isActive('/export') ? 'bg-tertiary text-white' : 'text-white'}
				flex items-center justify-center gap-2 rounded-sm p-1.5`}
				type="button"
				{disabled}
				onclick={() => navigateTo('/export')}
			>
				<span class="h-4 text-sm">Export</span>
			</button>
		</li>
		<li>
			<button
				class={`
					${disabled ? 'cursor-not-allowed opacity-50' : 'hover:cursor-pointer'}
					${isActive('/metrics') ? 'bg-tertiary text-white' : 'text-white'}
					flex items-center justify-center gap-2 rounded-sm p-1.5`}
				type="button"
				{disabled}
				onclick={() => navigateTo('/metrics')}
			>
				<span class="h-4 text-sm">Metrics</span>
			</button>
		</li>
		<!-- 
		This is commented out because this route doesn't exists yet and eslint complains about it
		<li>
			<button type="button" onclick={() => navigateTo('/graphics')}>Graphics</button>
		</li> 
		-->
		<li class="ml-auto">
			<Floatingmenu
				trigger={IconLayoutBoard}
				options={floatingmenuOptions}
				selectedValue={config?.uiMode.toString() || UIMode.Simple.toString()}
				onoptionselected={handleUIModeChange}
				triggerClass="text-tertiary hover:cursor-pointer"
				iconClass="h-5 w-5"
				tooltip="Layout Mode"
				{disabled}
			/>
		</li>
	</ul>
</navbar>
