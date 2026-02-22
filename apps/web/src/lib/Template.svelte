<script lang="ts">
  import { currentPath, navigate } from "./router";
  export let style: "light" | "dark" = "dark";
  $: path = $currentPath;
</script>

<header class="topbar {style}">
  <nav class="menu {style}" aria-label="Hovedmeny">
    <a
      href="/"
      aria-label="Forside"
      class:selected={path === "/"}
      on:click|preventDefault={() => navigate("/")}>FORSIDE</a
    >
    <a
      href="/praktisk"
      aria-label="Praktisk informasjon"
      class:selected={path === "/praktisk"}
      on:click|preventDefault={() => navigate("/praktisk")}
      >PRAKTISK INFORMASJON</a
    >
    <a
      href="/program"
      aria-label="Program"
      class:selected={path === "/program"}
      on:click|preventDefault={() => navigate("/program")}>PROGRAM</a
    >
    <a
      href="/kontakt"
      aria-label="Kontakt"
      class:selected={path === "/kontakt"}
      on:click|preventDefault={() => navigate("/kontakt")}>KONTAKT</a
    >
    <a href="#" aria-label="Ønskeliste">ØNSKELISTE</a>
  </nav>
</header>

<slot />

<footer class="footer">
  <small>&copy; {new Date().getFullYear()} Giftarmaal</small>
</footer>

<style>
  :root {
    --line: #e7ebe7;
    --ink: #000;
  }
  .topbar {
    position: fixed;
    inset: 0 0 auto 0;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    z-index: 10;
  }
  header.dark {
    background: rgba(242, 241, 238, 0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .menu {
    display: flex;
    gap: 18px;
    margin-left: auto;
  }
  .menu a {
    color: var(--ink);
    text-decoration: none;
    font-weight: 500;
    padding: 6px 8px;
    border-radius: 6px;
  }

  .menu.dark a {
    color: #787778;
  }
  .menu.light a {
    color: #b4b4b2;
  }

  .menu a.selected {
    font-weight: bold;
  }
  .footer {
    border-top: 1px solid var(--line);
    text-align: center;
    padding: 1.5rem 1rem;
    color: #6e756f;
  }
</style>
