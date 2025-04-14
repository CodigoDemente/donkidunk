<script lang="ts">
	export let start: number;
	export let end: number;
	export let total: number;
	export let color: string;
	export let name: string;
</script>

<div
	class={`absolute h-full rounded-xs opacity-80 hover:opacity-100`}
	style="
    left: calc(({start} / {total}) * 100%);
    width: calc(({end} - {start}) / {total} * 100%);
    background-color: {color};"
	aria-label={name}
	title={name}
>
	<!-- Add tooltip padding hover -->
	<div class="absolute inset-0 -m-[5px] hidden border border-transparent group-hover:block"></div>
</div>
