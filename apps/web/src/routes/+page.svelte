<script lang="ts">
  import { onMount } from 'svelte';
  let message = 'Loading...';
  onMount(async () => {
    const res = await fetch('/api/message');
    const data = await res.json();
    message = data.message ?? 'No message';
  });
</script>

<h1>{message}</h1>
