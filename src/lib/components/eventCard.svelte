<script>
	import { Card, Button } from 'flowbite-svelte';
	import { ArrowUpRightFromSquareSolid } from 'flowbite-svelte-icons';
	let { event } = $props();
	let maxDescriptionLength = 120;
</script>

<div>
	<Card class="h-full min-h-40">
		<div class="h-full flex-col place-content-between">
			<p class="my-4 font-serif text-xl text-black">{event.name}</p>
			<p class="overflow-hidden">
				<span class="my-4 font-serif text-lg text-black">about:</span>
				{event.description.substring(0, maxDescriptionLength)}{event.name.length >
				maxDescriptionLength
					? '...'
					: ''}
			</p>
			{#if event.numParticipants > 0}
				<p>
					<span class="my-4 font-serif text-lg text-black">participant limit:</span>
					{event.numParticipants}
				</p>
			{/if}
			<p>
				<span class="my-4 font-serif text-lg text-black">currently attending:</span>
				{event.participants.length}
			</p>
			{#if event.watingParticipants?.length > 0}
				<p>
					<span class="my-4 font-serif text-lg text-black">currently waiting:</span>
					{event.watingParticipants.length}
				</p>
			{/if}
		</div>
		<div class="my-2 place-self-end">
			<Button class="h-10 w-10" size="md" outline href="/{event.ownerId}/{event.chatId}/{event.id}"
				><ArrowUpRightFromSquareSolid size="sm" /></Button
			>
		</div>
	</Card>
</div>
