<script lang="ts">
  import { currentPath, navigate } from "./router";
  $: path = $currentPath;
</script>

<header class="topbar">
  <div class="brand">Giftarmaal</div>
  <nav class="menu" aria-label="Hovedmeny">
    <a
      href="/"
      aria-label="Forside"
      class:selected={path === "/"}
      on:click|preventDefault={() => navigate("/")}>Forside</a
    >
    <a
      href="/praktisk"
      aria-label="Praktisk informasjon"
      class:selected={path === "/praktisk"}
      on:click|preventDefault={() => navigate("/praktisk")}
      >Praktisk informasjon</a
    >
    <a
      href="/program"
      aria-label="Program"
      class:selected={path === "/program"}
      on:click|preventDefault={() => navigate("/program")}>Program</a
    >
    <a
      href="/kontakt"
      aria-label="Kontakt"
      class:selected={path === "/kontakt"}
      on:click|preventDefault={() => navigate("/kontakt")}>Kontakt</a
    >
    <a href="#" aria-label="Ønskeliste">Ønskeliste</a>
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
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(6px);
    border-bottom: 1px solid var(--line);
    z-index: 10;
  }
  .brand {
    font-weight: 600;
    letter-spacing: 0.02em;
  }
  .menu {
    display: flex;
    gap: 18px;
  }
  .menu a {
    color: var(--ink);
    text-decoration: none;
    font-weight: 500;
    padding: 6px 8px;
    border-radius: 6px;
  }
  .menu a:hover {
    background: #f5f7f6;
  }
  .menu a.selected {
    text-decoration: underline;
  }
  .footer {
    border-top: 1px solid var(--line);
    text-align: center;
    padding: 1.5rem 1rem;
    color: #6e756f;
  }
</style>
