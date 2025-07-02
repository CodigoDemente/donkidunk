<script lang="ts">
	export let interval: number;
	export let duration: number;
	export let height: string;
	export let width: string;
	export let color: string;
	export let label: string;
</script>

{#each Array(Math.ceil(duration / interval)).fill(0) as _, index (index)}
	<span
		class={`absolute ${height} ${width} ${color}`}
		style="left: calc(({index * interval} / {duration}) * 100%)"
		aria-label={label}
	></span>
{/each}
