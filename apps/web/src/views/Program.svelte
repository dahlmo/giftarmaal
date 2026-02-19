<script lang="ts">
  import Template from "../lib/Template.svelte";
  import { sseContentSlug } from "../lib/sse";
  import BlocksRenderer from "../lib/BlocksRenderer.svelte";
  import type { Block } from "../lib/blocks/types";
  import { onMount } from "svelte";
  import ScrollNudge from "../components/ScrollNudge.svelte";

  let blocks: Block[] = [];
  let loading = true;
  let error: string | null = null;

  function sanitizeBlocks(xs: Block[]): Block[] {
    const walk = (b: Block): Block => {
      const data: any = b.data ?? {};
      if (Array.isArray(data.children)) data.children = data.children.map(walk);
      return { ...b, data };
    };
    return (xs ?? []).map(walk);
  }

  // SSE auto-reload
  sseContentSlug.subscribe((x) => {
    if (x?.slug === "program") loadContent();
  });

  async function loadContent() {
    loading = true;
    error = null;
    try {
      const res = await fetch("/api/content/program", { cache: "no-store" });
      if (!res.ok) throw new Error("Kunne ikke hente innhold");
      const json = await res.json();
      blocks = sanitizeBlocks(
        (json?.data?.blocks ?? json?.blocks ?? []) as Block[],
      );
    } catch (e) {
      error = e instanceof Error ? e.message : "Ukjent feil";
      blocks = [];
    } finally {
      loading = false;
    }
  }

  onMount(loadContent);
</script>

<Template>
  <main class="page">
    <!-- HERO / INTRO -->
    <section class="intro">
      <div class="intro-inner">
        <h1 class="page-title">PROGRAM</h1>
        <p class="lead">Noter deg programmet, og forsøk å møte på tiden!</p>

        <ScrollNudge
          onClick={() => {
            document
              .querySelector(".content")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
        />
      </div>
    </section>

    <!-- CONTENT (from DB) -->
    <section class="content">
      <div class="wrap">
        {#if loading}
          <div>Laster innhold ...</div>
        {:else if error}
          <div class="error">{error}</div>
        {:else}
          <BlocksRenderer {blocks} />
        {/if}
      </div>
    </section>
  </main>
</Template>

<style>
  /* Kun top-delen (hero) */
  .page {
    min-height: 100vh;
    background: #f2f1ee;
    color: #2a2a2a;
  }

  .wrap {
    max-width: 760px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  .intro {
    min-height: calc(
      100vh - 72px
    ); /* juster hvis headeren din er annen høyde */
    display: grid;
    place-items: center;
    padding: 5.5rem 1rem 2.5rem;
    text-align: center;
  }

  .intro-inner {
    width: 100%;
    max-width: 760px;
  }

  .page-title {
    margin: 0;
    font-size: 2.2rem; /* match screenshot */
    letter-spacing: 0.28em;
    font-weight: 500;
  }

  .lead {
    margin: 1.1rem auto 0;
    max-width: 46ch;
    font-size: 1.05rem;
    line-height: 1.45;
    color: rgba(42, 42, 42, 0.7);
  }

  .scroll {
    margin-top: 4.5rem;
    color: rgba(42, 42, 42, 0.35);
    font-size: 1.6rem;
    line-height: 0.9;
    display: inline-flex;
    flex-direction: column;
    gap: 0.15rem;
    user-select: none;
  }

  .content {
    padding: 2rem 0 6rem;
  }

  .error {
    color: #dc4b4b;
    margin-top: 0.75rem;
  }

  @media (max-width: 820px) {
    .intro {
      min-height: calc(100vh - 64px);
      padding-top: 5rem;
    }
    .page-title {
      font-size: 1.9rem;
    }
    .lead {
      font-size: 1rem;
    }
  }
</style>
