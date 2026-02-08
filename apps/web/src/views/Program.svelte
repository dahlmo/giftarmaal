<script lang="ts">
  import Template from "../lib/Template.svelte";
  import { onMount } from "svelte";
  type ProgramItem = {
    id: number;
    time: string;
    title: string;
    detail?: string;
  };
  let loading = true;
  let error: string | null = null;
  let items: ProgramItem[] = [];

  onMount(async () => {
    try {
      const res = await fetch("/api/program");
      if (!res.ok) throw new Error("Kunne ikke hente program.");
      const data = await res.json();
      items = (data.items ?? []).sort((a: any, b: any) => a.order - b.order);
      loading = false;
    } catch (e: any) {
      error = e.message ?? "Ukjent feil";
      loading = false;
    }
  });
</script>

<svelte:head>
  <title>Program</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<Template>
  <main class="page">
    <div class="wrap">
      <section class="intro">
        <h1 class="page-title">PROGRAM</h1>
      </section>

      <section class="program">
        {#if loading}
          <div>Laster program ...</div>
        {:else if error}
          <div class="error">{error}</div>
        {:else if items.length === 0}
          <div>Ingen programposter er satt opp ennå.</div>
        {:else}
          <div class="timeline" role="list">
            {#each items as item (item.id)}
              <div class="row" role="listitem">
                <div class="time">{item.time}</div>
                <div class="desc">
                  <div class="text">
                    {item.title}
                    {#if item.detail}
                      <br />
                      {item.detail}
                    {/if}
                  </div>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </section>
    </div>
  </main>
</Template>

<style>
  :root {
    --ink: #2a2a2a;
    --muted: #6f756f;
    --line: rgba(42, 42, 42, 0.14);
    --bg: #f2f1ee;
    --card: #f7f6f2;
    --cta: #d8ccbf;
  }

  .page {
    min-height: 100vh;
    background: var(--bg);
    padding: 6.5rem 1rem 6rem;
    color: var(--ink);
  }

  .wrap {
    max-width: 760px;
    margin: 0 auto;
  }

  .intro {
    text-align: center;
    padding-top: 0.25rem;
    padding-bottom: 2.2rem;
  }

  .page-title {
    margin: 0;
    font-size: 1.45rem;
    letter-spacing: 0.08em;
    font-weight: 500;
  }

  /* Program layout */
  .program {
    margin-top: 0.5rem;
  }

  .day {
    margin: 3.2rem 0 0;
  }

  .day-title {
    text-align: center;
    margin: 0 0 1.4rem;
    letter-spacing: 0.38em;
    font-size: 0.95rem;
    font-weight: 600;
    color: rgba(42, 42, 42, 0.85);
  }

  .timeline {
    max-width: 520px;
    margin: 0 auto;
    border-top: 1px dotted var(--line);
  }

  .row {
    display: grid;
    grid-template-columns: 110px 1fr;
    gap: 2.2rem;
    padding: 1.05rem 0;
    border-bottom: 1px dotted var(--line);
    align-items: start;
  }

  .time {
    font-size: 0.95rem;
    color: rgba(42, 42, 42, 0.85);
    letter-spacing: 0.02em;
  }

  .desc {
    font-size: 0.98rem;
    line-height: 1.55;
    color: rgba(42, 42, 42, 0.9);
  }

  .text {
    max-width: 34ch;
  }

  @media (max-width: 560px) {
    .page {
      padding-top: 5.75rem;
    }
    .timeline {
      max-width: 100%;
    }
    .row {
      grid-template-columns: 90px 1fr;
      gap: 1.2rem;
    }
    .text {
      max-width: 100%;
    }
  }
</style>
