<script>
	import EventCard from '$lib/components/eventCard.svelte';

	let { data } = $props();
	let { events } = data;
</script>

<h1 class="m-2 font-serif text-lg text-black">All of your events overview.</h1>

<div class="centered">
	<div class="grid max-w-4xl grid-cols-3 gap-4">
		{#if events.length === 0}
			<p class="m-2 font-serif text-lg text-black">Only tumbleweed is here...</p>
		{/if}
		{#each events as event}
			<EventCard {event} />
		{/each}
	</div>
</div>
