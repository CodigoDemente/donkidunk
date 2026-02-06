<script lang="ts">
	import { boardContext } from '../board/context.svelte';
	import { timelineContext } from '../videoplayer/context.svelte';
	import { openProject } from '../menu/operations/openProject';
	import Button from '../../components/button/button.svelte';
	import { createNewProject } from '../menu/operations/createProject';
	import { configContext } from '../config/context.svelte';
	import donkidunkLogo from '../../styles/donkidunk_logo.png';

	const board = boardContext.get();
	const timeline = timelineContext.get();
	const config = configContext.get();

	function handleCreateProject() {
		createNewProject(board, timeline, config);
	}

	async function handleOpenProject() {
		await openProject(board, timeline, config);
	}
</script>

<div
	class="relative flex h-full w-full flex-col items-center justify-center gap-8 rounded-lg border border-gray-600 bg-gray-800"
>
	<img
		src={donkidunkLogo}
		alt="Donkidunk Logo"
		class="absolute top-1/2 left-1/2 h-4/5 w-4/5 -translate-x-1/2 -translate-y-1/2 object-contain opacity-10 grayscale"
	/>
	<div class="relative z-10 mb-8 flex flex-col items-center gap-4">
		<div class="welcome-arc text-center text-2xl font-semibold text-gray-200">Welcome to</div>
		<h1 class="donkidunk-text text-center text-6xl font-bold">Donkidunk</h1>
	</div>
	<div class="relative z-10 flex items-center gap-4">
		<Button size="extralarge" onClick={handleCreateProject}>New Project</Button>
		<span class="text-gray-200">or</span>
		<Button size="extralarge" tertiary onClick={handleOpenProject}>Open Project</Button>
	</div>
	<p class="relative z-10 text-center text-xl text-gray-200">
		Create a new project or open an existing one to get started
	</p>
</div>

<style>
	.welcome-arc {
		opacity: 0.6;
		transform: perspective(500px) rotateX(15deg);
		letter-spacing: 0.2em;
		text-transform: uppercase;
	}

	.donkidunk-text {
		color: #f97316;
		display: block;
		animation:
			glow 2s ease-in-out infinite alternate,
			pulse 2s ease-in-out infinite;
		text-shadow:
			0 0 10px rgba(249, 115, 22, 0.5),
			0 0 20px rgba(249, 115, 22, 0.3);
		letter-spacing: 0.05em;
		transform-origin: center;
	}

	@keyframes glow {
		from {
			text-shadow:
				0 0 10px rgba(249, 115, 22, 0.5),
				0 0 20px rgba(249, 115, 22, 0.3),
				0 0 30px rgba(249, 115, 22, 0.2);
		}
		to {
			text-shadow:
				0 0 20px rgba(249, 115, 22, 0.8),
				0 0 30px rgba(249, 115, 22, 0.5),
				0 0 40px rgba(249, 115, 22, 0.3);
		}
	}

	@keyframes pulse {
		0%,
		100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.05);
		}
	}
</style>
