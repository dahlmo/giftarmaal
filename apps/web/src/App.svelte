<script lang="ts">
  import { onMount } from 'svelte';
  import { writable } from 'svelte/store';
  import Home from './views/Home.svelte';
  import Message from './views/Message.svelte';

  const path = writable<string>(window.location.pathname);

  function navigate(to: string) {
    if (window.location.pathname !== to) {
      window.history.pushState({}, '', to);
      path.set(to);
    }
  }

  window.addEventListener('popstate', () => path.set(window.location.pathname));

  let message = 'Loading...';

  async function loadMessage() {
    const res = await fetch('/api/message');
    const data = await res.json();
    message = data?.message ?? 'No message';
  }

  onMount(() => {
    loadMessage();
  });

  $: currentPath = $path;
</script>

<nav>
  <a href="/" on:click|preventDefault={() => navigate('/')}>Home</a>
  |
  <a href="/message" on:click|preventDefault={() => navigate('/message')}>Message</a>
</nav>

{#if currentPath === '/message'}
  <Message {message} />
{:else}
  <Home {message} />
{/if}
