<script>
	let { data } = $props();
</script>

<h1>Hello and welcome to my site!</h1>

<div class="centered">
	<h1>New Messages</h1>

	<ul class="messages">
		{#each data.messages as message (message.message_id)}
			<li>
				<p>{new Date(message.date).toISOString()}</p>
				<p>{message.text}</p>
			</li>
		{/each}
	</ul>
</div>
