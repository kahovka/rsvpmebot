<script>
	import { Badge, Card, Toggle } from 'flowbite-svelte';
	import { Button } from 'flowbite-svelte';
	import { EditOutline, FloppyDiskAltOutline, TrashBinOutline } from 'flowbite-svelte-icons';
	import { Input, Label, Textarea, ButtonGroup } from 'flowbite-svelte';

	let { data } = $props();
	let { event } = data;
	let eventName = $state(event.name);
	let eventDescription = $state(event.description);
	let participantLimit = $state(event.numParticipants);
	let hasWaitingList = $state(event.hasWaitingList);
	let inEditing = $state(false);
	const toggleEditMode = () => {
		inEditing = inEditing ? false : true;
	};

	const resetFormValues = () => {
		eventName = event.name;
		eventDescription = event.description;
		participantLimit = event.numParticipants;
		hasWaitingList = event.hasWaitingList;
		inEditing = false;
	};
</script>

<div class="centered">
	<Card class="h-full min-h-40">
		<div>
			<form method="POST" action="?/updateEvent">
				<input type="hidden" name="eventId" value={event.id} />
				{#if !inEditing}
					<Button class="justify-self-end" outline color="red" size="xs" on:click={toggleEditMode}
						>Edit Event<EditOutline class="mx-1 h-3 w-3 shrink-0" /></Button
					>
				{/if}
				{#if inEditing}
					<ButtonGroup class="*:ring-primary-700!">
						<Button
							type="submit"
							class="justify-self-end"
							outline
							color="green"
							size="xs"
							aria-label="update-event">Save <FloppyDiskAltOutline class="mx-1 h-3 w-3" /></Button
						>
						<Button
							class="justify-self-end"
							outline
							color="red"
							size="xs"
							aria-label="discard-event-edit"
							on:click={resetFormValues}>Discard <TrashBinOutline class="mx-1 h-3 w-3" /></Button
						>
					</ButtonGroup>
				{/if}

				<Label for="form:eventName" class="font-serif text-lg text-black">name:</Label>
				<Input
					disabled={!inEditing}
					id="form:eventName"
					name="eventName"
					class="my-4 font-serif text-xl text-black"
					bind:value={eventName}
				/>

				<p class="my-2">
					<input type="hidden" name="eventDescription" value={eventDescription} />
					<Label for="form:eventDescription" class="font-serif text-lg text-black">about:</Label>
					<Textarea
						disabled={!inEditing}
						id="form:eventDescription"
						name="eventDescription"
						bind:value={eventDescription}
					></Textarea>
				</p>
				<p>
					<input type="hidden" name="participantLimit" value={participantLimit} />
					<Label for="form:participantLimit" class="font-serif text-lg text-black"
						>participants limit:</Label
					>
					<Input
						disabled={!inEditing}
						class="max-w-20"
						id="form:participantLimit"
						type="number"
						bind:value={participantLimit}
						required
					/>
				</p>
				<p>
					<input type="hidden" name="hasWaitingList" value={hasWaitingList} />
					<Label for="form:hasWaitingList" class="font-serif text-lg text-black"
						>with waiting list:</Label
					>
					<Toggle
						id="form:hasWaitingList"
						disabled={!inEditing}
						color="red"
						bind:checked={hasWaitingList}
					></Toggle>
				</p>
				{#if hasWaitingList && participantLimit < event.numParticipants}
					<Badge color="red"
						>Red New event is smaller than the old one. Extra participants will be moved to the
						waiting list.
					</Badge>
				{/if}
				{#if !hasWaitingList && participantLimit < event.numParticipants}
					<Badge color="red">
						New event is smaller than the old one and doesn't have a waiting list. Extra
						participants will be DELETED PERMANENTLY. Consider adding a waiting list.
					</Badge>
				{/if}
			</form>
		</div>
		<div>
			{#if event.participants.length > 0}
				<p class="my-2 font-serif text-lg text-black">participants:</p>
				<div class="mx-2">
					{#each event.participants as participant, index}
						<form class="m-1 flex max-w-72" method="POST" action="?/deleteParticipant">
							<input type="hidden" name="participantId" value={participant.id} />
							<input type="hidden" name="eventId" value={event.id} />
							<p class="min-w-68">{index + 1}. {participant.name}</p>
							<Button
								hidden={!inEditing}
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
								hidden={!inEditing}
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
		</div>
	</Card>

	<Button class="my-4" outline href="/{event.ownerId}">Take me to my events</Button>
</div>
