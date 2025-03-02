<script>
	let { data } = $props();
	let { events } = data;
</script>

<h1>Hello and welcome to my site!</h1>

<div class="centered">
	<h1>New Messages</h1>

	<ul class="messages">
		{JSON.stringify(data)}
		{#each events as event}
			<li>
				<p>{event.content}</p>
			</li>
		{/each}
	</ul>
</div>
