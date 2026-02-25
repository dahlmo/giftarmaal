<script lang="ts">
  import RsvpSection from "../lib/RsvpSection.svelte";
  import Template from "../lib/Template.svelte";

  let rsvpOpen = false;
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <title>Giftarmaal</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
<div
  class="rsvp-backdrop"
  class:open={rsvpOpen}
  on:click={() => (rsvpOpen = false)}
/>

<div class="rsvp-drawer" class:open={rsvpOpen} role="dialog" aria-modal="true">
  <div class="rsvp-drawer-top">
    <div class="rsvp-handle" />
    <button
      class="rsvp-close"
      on:click={() => (rsvpOpen = false)}
      aria-label="Lukk"
    >
      ✕
    </button>
  </div>
  <RsvpSection />
</div>

<Template style="dark">
  <section class="cover">
    <div class="cover-inner">
      <img class="logo" src="/img/logo_with_date.png" alt="E&M 4. juli 2026" />
      <button class="rsvp-cta" on:click={() => (rsvpOpen = true)}>
        Svar på invitasjon
      </button>
    </div>
  </section>

  <main class="page1">
    <section class="intro">
      <p class="lead">
        Velkommen til bryllupet vårt. Vi gleder oss til å feire dagen sammen med
        dere.
      </p>
    </section>
  </main>
</Template>

<style>
  :root {
    --bg: #fff;
    --ink: #000;
    --muted: #6e756f;
    --line: #e7ebe7;
    --accent: #6f6c2f;
  }

  :global(*) {
    box-sizing: border-box;
  }
  :global(html),
  :global(body) {
    margin: 0;
    padding: 0;
    background: var(--bg);
    color: var(--ink);
  }
  :global(body) {
    line-height: 1.6;
  }

  /* ── Backdrop ── */
  .rsvp-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.4s ease;
    z-index: 49;
  }
  .rsvp-backdrop.open {
    opacity: 1;
    pointer-events: auto;
  }

  /* ── Drawer ── */
  .rsvp-drawer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 50;
    transform: translateY(100%);
    transition: transform 0.45s cubic-bezier(0.32, 0.72, 0, 1);
    max-height: 90vh;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .rsvp-drawer.open {
    transform: translateY(0);
  }

  .rsvp-drawer-top {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1rem 0;
    background: #54565b;
    position: relative;
  }

  .rsvp-handle {
    width: 40px;
    height: 4px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.3);
  }

  .rsvp-close {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    font-size: 1.1rem;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    line-height: 1;
  }
  .rsvp-close:hover {
    color: #fff;
  }

  /* ── Cover ── */
  .cover {
    min-height: 100vh;
    display: grid;
    place-items: center;
    background:
      linear-gradient(180deg, rgba(0, 0, 0, 0.72), rgba(0, 0, 0, 0.72)),
      url("/img/hero.jpg") center / cover no-repeat;
    border-bottom: 1px solid var(--line);
  }

  .cover-inner {
    text-align: center;
    padding: 0rem 1rem 3rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2.5rem;
  }

  .logo {
    width: min(75vw, 720px);
    height: auto;
    display: block;
    filter: drop-shadow(0 2px 12px rgba(0, 0, 0, 0.2));
  }

  .rsvp-cta {
    padding: 0.75rem 2.5rem;
    border: 1px solid rgba(255, 255, 255, 0.75);
    background: transparent;
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.85rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    cursor: pointer;
    border-radius: 2px;
    transition:
      background 0.2s ease,
      border-color 0.2s ease;
  }
  .rsvp-cta:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: #fff;
  }

  /* ── Content ── */
  .page1 {
    max-width: 900px;
    margin: 0 auto;
    padding: 2.5rem 1rem 4rem;
  }

  .lead {
    font-size: 1.1rem;
    color: var(--muted);
    text-align: center;
  }
</style>
