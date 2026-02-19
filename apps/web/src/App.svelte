<script lang="ts">
  import { onMount } from "svelte";
  import Home from "./views/Home.svelte";
  import Message from "./views/Message.svelte";
  import Admin from "./views/Admin.svelte";
  import PracticalInfo from "./views/PracticalInfo.svelte";
  import Program from "./views/Program.svelte";
  import Contact from "./views/Contact.svelte";
  import { currentPath } from "./lib/router";

  onMount(() => {});

  $: path = $currentPath;
</script>

{#if path === "/handtere"}
  <Admin />
{:else if path === "/praktisk"}
  <PracticalInfo />
{:else if path === "/program"}
  <Program />
{:else if path === "/kontakt"}
  <Contact />
{:else}
  <Home />
{/if}
