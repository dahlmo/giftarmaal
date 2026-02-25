<script lang="ts">
  import RsvpSection from "../lib/RsvpSection.svelte";
  import Template from "../lib/Template.svelte";
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <title>Giftarmaal</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<Template style="light">
  <section class="cover">
    <div class="cover-inner">
      <img class="logo" src="/img/logo_with_date.png" alt="E&M 4. juli 2026" />
    </div>
  </section>

  <RsvpSection />

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

  .cover {
    min-height: 70vh;
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
  }

  .logo {
    width: min(75vw, 720px);
    height: auto;
    display: block;
    margin: 0 auto;
    filter: drop-shadow(0 2px 12px rgba(0, 0, 0, 0.2));
  }

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
