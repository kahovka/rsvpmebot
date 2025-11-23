<script lang="ts">
	import { Badge, Card, Toggle } from 'flowbite-svelte';
	import { Button } from 'flowbite-svelte';
	import {
		EditOutline,
		FloppyDiskAltOutline,
		TrashBinOutline,
		ArrowUpOutline,
		ArrowDownOutline
	} from 'flowbite-svelte-icons';
	import { Input, Label, Textarea, ButtonGroup } from 'flowbite-svelte';
	import type { DisplayEventParticipant } from '$lib/types/DisplayEvent.js';

	let { data } = $props();
	let { event } = data;
	let eventName = $state(event.name);
	let eventDescription = $state(event.description);
	let participantLimit = $state(event.numParticipants);
	let hasWaitingList = $state(event.hasWaitingList);
	let allowsPlusOne = $state(event.allowsPlusOne);
	let inEditing = $state(false);
	let allParticipants = $derived.by(() => {
		const eventParticipants = [...event.participants, ...event.waitingParticipants];
		const x = hasWaitingList;
		const allParticipants = allowsPlusOne
			? eventParticipants
			: eventParticipants.filter(({ isPlusOne }) => isPlusOne !== true);
		return allParticipants;
	});
	let registeredParticipants = $derived([...allParticipants].splice(0, participantLimit));
	let waitingParticipants = $derived(
		hasWaitingList ? [...allParticipants].splice(participantLimit) : []
	);
	let deletedParticipants = $derived.by(() => {
		const originalParticipants = [...event.participants, ...event.waitingParticipants];
		return originalParticipants.filter(
			(participant) =>
				!(registeredParticipants.includes(participant) || waitingParticipants.includes(participant))
		);
	});

	const resetFormValues = () => {
		eventName = event.name;
		eventDescription = event.description;
		participantLimit = event.numParticipants;
		hasWaitingList = event.hasWaitingList;
		allowsPlusOne = event.allowsPlusOne;
		allParticipants = [...event.participants, ...event.waitingParticipants];
		registeredParticipants = event.participants;
		waitingParticipants = event.waitingParticipants;
		inEditing = false;
	};

	const isFirstParticipant = (participant: DisplayEventParticipant) =>
		allParticipants.findIndex((member) => member === participant) === 0;

	const isLastParticipant = (participant: DisplayEventParticipant) =>
		allParticipants.findIndex((member) => member === participant) === allParticipants.length - 1;

	const reassembleParticipants = () => {
		allParticipants = allowsPlusOne
			? allParticipants
			: allParticipants.filter(({ isPlusOne }) => isPlusOne !== true);
		registeredParticipants = [...allParticipants].splice(0, participantLimit);
		waitingParticipants = hasWaitingList ? [...allParticipants].splice(participantLimit) : [];
	};

	const moveParticipantUp = (participant: DisplayEventParticipant): void => {
		if (isFirstParticipant(participant)) {
			// cannot move up
			return;
		}
		const participantInd = allParticipants.findIndex((member) => member === participant);

		const tmp = allParticipants[participantInd];
		allParticipants[participantInd] = allParticipants[participantInd - 1];
		allParticipants[participantInd - 1] = tmp;

		// reshuffle participants
		reassembleParticipants();
	};

	const moveParticipantDown = (participant: DisplayEventParticipant): void => {
		if (isLastParticipant(participant)) {
			// cannot move down
			return;
		}
		const participantInd = allParticipants.findIndex((member) => member === participant);

		const tmp = allParticipants[participantInd];
		allParticipants[participantInd] = allParticipants[participantInd + 1];
		allParticipants[participantInd + 1] = tmp;

		// reshuffle participants
		reassembleParticipants();
	};

	const deleteParticipant = (participant: DisplayEventParticipant): void => {
		allParticipants = allParticipants.filter((member) => member !== participant);
		reassembleParticipants();
	};

	const toggleEditMode = () => {
		inEditing = inEditing ? false : true;
	};
</script>

<div class="centered">
	<Card class="h-full min-h-40 min-w-110">
		<form method="POST" action="?/updateEvent">
			<div>
				<input type="hidden" name="eventId" value={event.id} />
				<div class="justify-self-end p-2">
					{#if !inEditing}
						<Button outline color="red" size="xs" on:click={toggleEditMode}
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
				</div>
				<div>
					<Input
						disabled={!inEditing}
						class={inEditing
							? 'my-0 font-serif text-xl text-black'
							: 'my-4 border-none bg-transparent p-0 font-serif text-xl text-black disabled:opacity-100'}
						id="form:eventName"
						name="eventName"
						bind:value={eventName}
					/>
				</div>
				<div class="my-4">
					<input type="hidden" name="eventDescription" value={eventDescription} />
					<Label for="form:eventDescription" class="font-serif text-lg text-black">about:</Label>
					<Textarea
						disabled={!inEditing}
						class={inEditing ? 'mx-0' : 'border-none bg-transparent disabled:opacity-100'}
						id="form:eventDescription"
						name="eventDescription"
						bind:value={eventDescription}
					></Textarea>
				</div>
				<div class="my-4 flex">
					<input type="hidden" name="participantLimit" value={participantLimit} />
					<Label
						for="form:participantLimit"
						class={inEditing
							? 'my-2 font-serif text-lg text-black'
							: 'font-serif text-lg text-black'}>participants limit:</Label
					>
					<Input
						disabled={!inEditing}
						class={inEditing
							? 'mx-2 max-w-20'
							: 'mx-2 max-w-20 border-none bg-transparent p-0 font-serif text-lg text-black disabled:opacity-100'}
						id="form:participantLimit"
						type="number"
						bind:value={participantLimit}
						required
					/>
				</div>
				<div class="my-4 flex">
					<input type="hidden" name="hasWaitingList" value={hasWaitingList} />
					<Label for="form:hasWaitingList" class="font-serif text-lg text-black"
						>with waiting list:</Label
					>
					<Toggle
						class="mx-2 my-0"
						id="form:hasWaitingList"
						disabled={!inEditing}
						color="red"
						bind:checked={hasWaitingList}
					>
						{#snippet offLabel()}
							No
						{/snippet}
						Yes</Toggle
					>
				</div>
				<div>
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
				</div>
				<div class="my-4 flex">
					<input type="hidden" name="allowsPlusOne" value={allowsPlusOne} />
					<Label for="form:allowsPlusOne" class="font-serif text-lg text-black"
						>people can bring someone along:</Label
					>
					<Toggle
						class="text-m text-gray mx-2 my-0"
						id="form:allowsPlusOne"
						disabled={!inEditing}
						color="red"
						bind:checked={allowsPlusOne}
					>
						{#snippet offLabel()}
							No
						{/snippet}
						Yes
					</Toggle>
				</div>
				<div>
					{#if !allowsPlusOne && event.allowsPlusOne}
						<Badge color="red">
							New event won't allow for plus ones. All plus one participants will be DELETED
							PERMANENTLY. Are you sure?
						</Badge>
					{/if}
				</div>
			</div>
			<div>
				<input
					type="hidden"
					name="registeredParticipants"
					value={JSON.stringify(registeredParticipants)}
				/>
				{#if registeredParticipants.length > 0}
					<p class="my-2 font-serif text-lg text-black">participants:</p>
					<div class="mx-2 max-w-100">
						{#each registeredParticipants as participant, index}
							<div class="inline-flex w-full items-center justify-between p-1">
								<p class="text-m text-gray max-w-65">{index + 1}. {participant.name}</p>
								<div class="max-w-35">
									<Button
										hidden={!inEditing || isFirstParticipant(participant)}
										class="p-2"
										outline
										color="purple"
										size="xs"
										aria-label="delete-participant"
										on:click={() => moveParticipantUp(participant)}
										><ArrowUpOutline size="lg" class="h-3 w-3" /></Button
									>
									<Button
										hidden={!inEditing || isLastParticipant(participant)}
										class="p-2"
										outline
										color="purple"
										size="xs"
										aria-label="delete-participant"
										on:click={() => moveParticipantDown(participant)}
										><ArrowDownOutline size="lg" class="h-3 w-3" /></Button
									>
									<Button
										hidden={!inEditing}
										outline
										color="red"
										size="xs"
										on:click={() => deleteParticipant(participant)}
										aria-label="delete-participant"><TrashBinOutline class="h-3 w-3" /></Button
									>
								</div>
							</div>
						{/each}
					</div>
				{/if}
				<input
					type="hidden"
					name="waitingParticipants"
					value={JSON.stringify(waitingParticipants)}
				/>
				{#if waitingParticipants.length > 0}
					<p class="my-2 font-serif text-lg text-black">waiting list:</p>
					<div class="mx-2">
						{#each waitingParticipants as participant, index}
							<div class="inline-flex w-full items-center justify-between p-1">
								<p class="max-w-65">{index + 1}. {participant.name}</p>
								<div class="max-w-35">
									<Button
										hidden={!inEditing || isFirstParticipant(participant)}
										class="p-2"
										outline
										color="purple"
										size="xs"
										aria-label="delete-participant"
										on:click={() => moveParticipantUp(participant)}
										><ArrowUpOutline size="lg" class="h-3 w-3" /></Button
									>
									<Button
										hidden={!inEditing || isLastParticipant(participant)}
										class="p-2"
										outline
										color="purple"
										size="xs"
										aria-label="delete-participant"
										on:click={() => moveParticipantDown(participant)}
										><ArrowDownOutline size="lg" class="h-3 w-3" /></Button
									>
									<Button
										hidden={!inEditing}
										outline
										color="red"
										size="xs"
										on:click={() => deleteParticipant(participant)}
										aria-label="delete-participant"><TrashBinOutline class="h-3 w-3" /></Button
									>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
			{JSON.stringify(deletedParticipants)}
			<input type="hidden" name="deletedParticipants" value={JSON.stringify(deletedParticipants)} />
		</form>
	</Card>

	<Button class="my-4" outline href="/{event.ownerId}">Take me to my events</Button>
</div>
