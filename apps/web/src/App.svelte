<script lang="ts">
  import { onMount } from "svelte";
  import Home from "./views/Home.svelte";
  import Message from "./views/Message.svelte";
  import Admin from "./views/Admin.svelte";
  import PracticalInfo from "./views/PracticalInfo.svelte";
  import Program from "./views/Program.svelte";
  import Contact from "./views/Contact.svelte";
  import PrivacyPolicy from "./views/PrivacyPolicy.svelte";
  import Wishlist from "./views/Wishlist.svelte";
  import { currentPath } from "./lib/router";
  import { isSpouse } from "./lib/auth";

  onMount(() => {});

  $: path = $currentPath;
</script>

{#if path === "/handtere" && $isSpouse}
  <Admin />
{:else if path === "/praktisk"}
  <PracticalInfo />
{:else if path === "/program"}
  <Program />
{:else if path === "/roller"}
  <Contact />
{:else if path === "/gaveonsker"}
  <Wishlist />
{:else if path === "/personvern"}
  <PrivacyPolicy />
{:else}
  <Home />
{/if}
