<script lang="ts">
	export let interval: number;
	export let duration: number;
	export let height: string;
	export let width: string;
	export let color: string;
	export let label: string;
</script>

<!-- eslint-disable-line @typescript-eslint/no-unused-vars -->
{#each Array(Math.ceil(duration / interval)).fill(0) as _, index (index)}
	{(_ = _)}
	<!-- No-op to avoid unused variable error -->
	<span
		class={`absolute ${height} ${width} ${color}`}
		style="left: calc(({index * interval} / {duration}) * 100%)"
		aria-label={label}
	></span>
{/each}
