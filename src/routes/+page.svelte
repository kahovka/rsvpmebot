<script>
	import EventCard from '$lib/components/eventCard.svelte';

	let { data } = $props();
	let { events } = data;
</script>

<h1>Hello and welcome to my site!</h1>

<div class="centered">
	<h1>New Messages</h1>

	<div class="grid max-w-4xl grid-cols-3 gap-4">
		{#each events as event}
			<EventCard {event} />
		{/each}
	</div>
</div>
