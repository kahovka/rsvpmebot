<script>
	import { Card } from 'flowbite-svelte';

	let { data } = $props();
	let { event } = data;
</script>

<div class="centered">
	<Card class="h-full min-h-40">
		<p>
			{event?.name}
		</p>
		<p>
			{event?.description}
		</p>
		<p>Num Participants: {event?.numParticipants}</p>
		{#if event.participants.length > 0}
			<p>Participants:</p>
			{#each event.participants as participant}
				<form method="POST" action="?/deleteParticipant">
					<input type="hidden" name="participantId" value={participant.id} />
					<input type="hidden" name="eventId" value={event.id} />
					<p>{participant.name}</p>
					<button aria-label="delete-participant">x</button>
				</form>
			{/each}
		{/if}
		{#if event.waitingParticipants.length > 0}
			<p>Waiting list:</p>
			{#each event.waitingParticipants as participant}
				<p>{participant.name}</p>
			{/each}
		{/if}
	</Card>
</div>
