<script>
	import { Card, Button } from 'flowbite-svelte';
	let { event } = $props();
	let maxDescriptionLength = 120;
</script>

<div>
	<Card class="h-full min-h-40">
		<div class="flex-0">
			<div>
				<h2>{event.name}</h2>
				<p>
					<b>Description:</b>
					{event.name.substring(0, maxDescriptionLength)}{event.name.length > maxDescriptionLength
						? '...'
						: ''}
				</p>
				{#if event.numParticipants > 0}
					<p><b>Max paritipants:</b> {event.numParticipants}</p>
				{/if}
				<p><b>Current participants:</b> {event.participants.length}</p>
				{#if event.watingParticipants.length > 0}
					<p><b>Current waitlist:</b> {event.watingParticipants.length}</p>
				{/if}
			</div>
			<Button class="max-w-8" size="sm" color="blue">Go</Button>
		</div>
	</Card>
</div>
