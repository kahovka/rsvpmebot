<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<p class="m-4 font-serif text-xl text-black">RSVP Me bot scrappy UI</p>
<div class="m-4">
	{@render children()}
</div>
