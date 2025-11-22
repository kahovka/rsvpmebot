<script>
	import { Card } from 'flowbite-svelte';
	import { Button } from 'flowbite-svelte';
	import { TrashBinOutline } from 'flowbite-svelte-icons';

	let { data } = $props();
	let { event } = data;
</script>

<div class="centered">
	<Card class="h-full min-h-40">
		<h2 class="my-4 font-serif text-xl text-black">{event?.name}</h2>

		<p class="my-2">
			<span class="font-serif text-lg text-black">about:</span>
			{event?.description}
		</p>
		<p>
			<span class="font-serif text-lg text-black">participants limit:</span>
			{event?.numParticipants}
		</p>
		{#if event.participants.length > 0}
			<p class="my-2 font-serif text-lg text-black">participants:</p>
			<div class="mx-2">
				{#each event.participants as participant, index}
					<form class="m-1 flex max-w-72" method="POST" action="?/deleteParticipant">
						<input type="hidden" name="participantId" value={participant.id} />
						<input type="hidden" name="eventId" value={event.id} />
						<p class="min-w-68">{index + 1}. {participant.name}</p>
						<Button
							type="submit"
							class="justify-self-end"
							outline
							color="red"
							size="xs"
							aria-label="delete-participant"><TrashBinOutline class="h-3 w-3" /></Button
						>
					</form>
				{/each}
			</div>
		{/if}
		{#if event.waitingParticipants.length > 0}
			<p class="my-2 font-serif text-lg text-black">waiting list:</p>
			<div class="mx-2">
				{#each event.waitingParticipants as participant, index}
					<form class="m-1 flex max-w-72" method="POST" action="?/deleteParticipant">
						<input type="hidden" name="participantId" value={participant.id} />
						<input type="hidden" name="eventId" value={event.id} />
						<p class="min-w-68">{index + 1}. {participant.name}</p>
						<Button
							type="submit"
							class="justify-self-end"
							outline
							color="red"
							size="xs"
							aria-label="delete-participant"><TrashBinOutline class="h-3 w-3" /></Button
						>
					</form>
				{/each}
			</div>
		{/if}
	</Card>

	<Button class="my-4" outline href="/{event.ownerId}">Take me to my events</Button>
</div>
