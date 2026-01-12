<script lang="ts">
	import { CategoryType } from '../../../components/box/types';

	type Props = {
		categoryType: CategoryType;
	};

	let { categoryType }: Props = $props();
</script>

<p class="p-4 text-gray-100">
	{#if categoryType === CategoryType.Event}
		This action will remove all timeline events associated with this event. <br />
	{:else}
		This action will remove this tag from all timeline events. <br />
	{/if}
	<strong> Are you sure you want to delete this category? </strong>
</p>
