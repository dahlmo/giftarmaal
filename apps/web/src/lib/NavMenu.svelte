<script lang="ts">
  import { currentPath, navigate } from "./router";

  export let style: "light" | "dark" = "dark";

  let open = false;
  $: path = $currentPath;

  const links = [
    { href: "/", label: "FORSIDE" },
    { href: "/praktisk", label: "PRAKTISK INFORMASJON" },
    { href: "/program", label: "PROGRAM" },
    { href: "/kontakt", label: "KONTAKT" },
    { href: "#", label: "ØNSKELISTE" },
  ];

  function go(href: string) {
    if (href !== "#") navigate(href);
    open = false;
  }
</script>

<header class="topbar {style}">
  <a class="logo-link" href="/" on:click|preventDefault={() => go("/")}>
    <img src="/img/logo_wo_date_{style}.png" alt="Logo" class="logo" />
  </a>
  <nav class="desktop-nav {style}" aria-label="Hovedmeny">
    {#each links as link}
      <a
        href={link.href}
        class:selected={path === link.href}
        on:click|preventDefault={() => go(link.href)}
      >
        {link.label}
      </a>
    {/each}
    <span class="spacer" />
  </nav>

  <button
    class="burger {style}"
    on:click={() => (open = !open)}
    aria-label={open ? "Lukk meny" : "Åpne meny"}
    aria-expanded={open}
    aria-controls="mobile-menu"
  >
    <svg
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      aria-hidden="true"
    >
      {#if open}
        <line
          x1="4"
          y1="4"
          x2="20"
          y2="20"
          stroke="currentColor"
          stroke-width="1.9"
          stroke-linecap="round"
        />
        <line
          x1="20"
          y1="4"
          x2="4"
          y2="20"
          stroke="currentColor"
          stroke-width="1.9"
          stroke-linecap="round"
        />
      {:else}
        <line
          x1="3"
          y1="6.5"
          x2="21"
          y2="6.5"
          stroke="currentColor"
          stroke-width="1.9"
          stroke-linecap="round"
        />
        <line
          x1="3"
          y1="12"
          x2="21"
          y2="12"
          stroke="currentColor"
          stroke-width="1.9"
          stroke-linecap="round"
        />
        <line
          x1="3"
          y1="17.5"
          x2="21"
          y2="17.5"
          stroke="currentColor"
          stroke-width="1.9"
          stroke-linecap="round"
        />
      {/if}
    </svg>
  </button>
</header>

<div
  id="mobile-menu"
  class="mobile-panel {style}"
  class:open
  aria-hidden={!open}
>
  <nav class="mobile-nav" aria-label="Mobilmeny">
    <!-- svelte-ignore a11y-missing-attribute -->
    {#each links as link}
      <a
        href={link.href}
        class="mobile-link"
        class:selected={path === link.href}
        on:click|preventDefault={() => go(link.href)}
        tabindex={open ? 0 : -1}
      >
        {link.label}
      </a>
    {/each}
  </nav>
</div>

<style>
  /* ── Topbar ── */
  .topbar {
    position: fixed;
    inset: 0 0 auto 0;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    padding: 0 1rem;
    z-index: 200;
    overflow: hidden;
  }

  .topbar.dark {
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
  }

  .topbar.light {
    background: rgba(242, 241, 238, 0.88);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
  }

  /* ── Desktop nav ── */
  .desktop-nav {
    display: flex;
    gap: 18px;
    align-items: center;
    margin-left: auto;
  }

  .desktop-nav a {
    text-decoration: none;
    font-weight: 500;
    padding: 6px 8px;
    border-radius: 6px;
    font-size: 0.78rem;
    letter-spacing: 0.1em;
    transition: opacity 0.15s;
  }

  .desktop-nav.dark a {
    color: #787778;
  }

  .desktop-nav.light a {
    color: #b4b4b2;
  }

  .desktop-nav a:hover {
    opacity: 0.7;
  }

  .desktop-nav a.selected {
    font-weight: 700;
  }

  .spacer {
    flex: 1;
  }

  /* ── Hamburger button ── */
  .burger {
    display: none;
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    margin-left: auto;
    line-height: 0;
    border-radius: 6px;
  }

  .burger.dark {
    color: #555;
  }

  .burger.light {
    color: #888;
  }

  /* ── Mobile panel ── */
  .mobile-panel {
    position: fixed;
    top: 64px;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 199;
    padding: 1.75rem 1.75rem 3rem;
    overflow-y: auto;
    /* hidden state */
    transform: translateY(-6px);
    opacity: 0;
    pointer-events: none;
    visibility: hidden;
    transition:
      transform 0.28s cubic-bezier(0.32, 0.72, 0, 1),
      opacity 0.28s ease,
      visibility 0s linear 0.28s;
  }

  .mobile-panel.open {
    transform: translateY(0);
    opacity: 1;
    pointer-events: auto;
    visibility: visible;
    transition:
      transform 0.28s cubic-bezier(0.32, 0.72, 0, 1),
      opacity 0.28s ease,
      visibility 0s linear 0s;
  }

  .mobile-panel.dark {
    background: #161616;
  }

  .mobile-panel.light {
    background: #f2f1ee;
  }

  /* ── Mobile nav links ── */
  .mobile-nav {
    display: flex;
    flex-direction: column;
    margin-top: 0.25rem;
  }

  .mobile-link {
    display: block;
    padding: 1.05rem 0;
    font-size: 0.92rem;
    letter-spacing: 0.22em;
    font-weight: 500;
    text-decoration: none;
    border-bottom: 1px solid transparent;
    transition: opacity 0.15s;
  }

  .mobile-link:active {
    opacity: 0.5;
  }

  .mobile-panel.dark .mobile-link {
    color: rgba(255, 255, 255, 0.78);
    border-bottom-color: rgba(255, 255, 255, 0.07);
  }

  .mobile-panel.light .mobile-link {
    color: #2a2a2a;
    border-bottom-color: rgba(42, 42, 42, 0.1);
  }

  .mobile-link.selected {
    font-weight: 700;
  }

  .mobile-panel.dark .mobile-link.selected {
    color: #fff;
  }

  .mobile-panel.light .mobile-link.selected {
    color: #000;
  }

  /* Logo left */
  .logo-link {
    display: flex;
    align-items: center;
    margin-right: auto;
  }

  .logo {
    height: 34px;
    width: auto;
    display: block;
    opacity: 0.92;
    transition: opacity 0.15s ease;
  }

  .logo:hover {
    opacity: 1;
  }

  .desktop-nav {
    margin-left: 2rem;
  }

  @media (min-width: 1024px) {
    .burger {
      display: none !important;
    }
    .mobile-panel {
      display: none !important;
    }
    .desktop-nav {
      display: flex;
    }
  }

  @media (max-width: 1023px) {
    .burger {
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .desktop-nav {
      display: none;
    }
  }
</style>
