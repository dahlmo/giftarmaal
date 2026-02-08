<script lang="ts">
  import type { Block } from "./blocks/types";

  export let blocks: Block[] = [];

  function cls(layout?: any) {
    const w = layout?.width ?? "content";
    const a = layout?.align ?? "center";
    return `w-${w} a-${a}`;
  }
</script>

{#each blocks as b (b.id)}
  <section class={"block " + cls(b.layout)}>
    {#if b.type === "heading"}
      {#if (b.data?.level ?? "2") === "1"}
        <h1>{b.data?.text ?? ""}</h1>
      {:else if (b.data?.level ?? "2") === "3"}
        <h3>{b.data?.text ?? ""}</h3>
      {:else if (b.data?.level ?? "2") === "4"}
        <h4>{b.data?.text ?? ""}</h4>
      {:else}
        <h2 class="rule-title"><span>{b.data?.text ?? ""}</span></h2>
      {/if}
    {:else if b.type === "text"}
      <div class="prose">{@html b.data?.text ?? ""}</div>
    {:else if b.type === "cta"}
      {#if b.data?.href}
        <a class="cta" href={b.data.href} rel="noopener noreferrer">
          {b.data?.label ?? "Les mer"}
        </a>
      {/if}
    {:else if b.type === "grid"}
      {@const cols = Number(b.data?.columns ?? 3)}
      <div
        class="grid"
        style={"grid-template-columns: repeat(" +
          (cols || 3) +
          ", minmax(0, 1fr))"}
      >
        {#each b.data?.items ?? [] as it, idx (idx)}
          <div class="card">
            {#if it?.title}<h3>{it.title}</h3>{/if}
            {#if it?.text}
              <p>{it.text}</p>
            {/if}
          </div>
        {/each}
      </div>
    {:else if b.type === "faq"}
      {#if b.data?.title}
        <h2 class="section-title">{b.data.title}</h2>
      {/if}
      <div class="faq">
        {#each b.data?.items ?? [] as qa, idx (idx)}
          <div class="qa">
            <p class="q">{qa?.q ?? ""}</p>
            <p class="a">{qa?.a ?? ""}</p>
          </div>
        {/each}
      </div>
    {:else if b.type === "section"}
      {#if b.data?.title}
        <h2 class="section-title"><span>{b.data.title}</span></h2>
      {/if}
      <div class="stack">
        <svelte:self blocks={b.data?.children ?? []} />
      </div>
    {:else if b.type === "divider"}
      <hr class="divider" />
    {:else if b.type === "spacer"}
      {@const size = b.data?.size ?? "md"}
      <div class={"spacer " + size}></div>
    {/if}
  </section>
{/each}

<style>
  .block {
    margin: 3rem 0;
  }
  .w-narrow {
    max-width: 520px;
    margin-left: auto;
    margin-right: auto;
  }
  .w-content {
    max-width: 760px;
    margin-left: auto;
    margin-right: auto;
  }
  .w-full {
    max-width: 100%;
  }

  .a-left {
    text-align: left;
  }
  .a-center {
    text-align: center;
  }

  h1,
  h2,
  h3,
  h4 {
    margin: 0 0 0.8rem;
  }

  .rule-title {
    margin: 0 0 1.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.15rem;

    font-family: "Montserrat", sans-serif;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.28em;

    font-size: 1.55rem; /* matcher høyre */
    line-height: 1.1;
    color: rgba(42, 42, 42, 0.92);

    text-align: center;
  }

  .rule-title::before,
  .rule-title::after {
    content: "";
    height: 1px;
    background: rgba(42, 42, 42, 0.18); /* lysere / mer elegant */
    flex: 1;
    max-width: 260px; /* matcher høyre blokk */
  }

  .rule-title span {
    transform: translateY(1px);
    white-space: nowrap;
  }

  .prose p {
    margin: 0.35rem 0;
    line-height: 1.55;
  }

  .cta {
    display: inline-block;
    padding: 0.6rem 1.2rem;
    border-radius: 999px;
    text-decoration: none;
  }

  .grid {
    display: grid;
    gap: 1rem;
  }
  .card {
    padding: 0.8rem;
    border-radius: 12px;
    border: 1px solid rgba(0, 0, 0, 0.08);
  }

  .divider {
    border: 0;
    height: 1px;
    background: rgba(0, 0, 0, 0.12);
  }

  .spacer.sm {
    height: 1rem;
  }
  .spacer.md {
    height: 2rem;
  }
  .spacer.lg {
    height: 3.5rem;
  }

  .section-title {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    letter-spacing: 0.18em;
    font-weight: 600;
    margin: 0 0 1.5rem;
  }
  .section-title::before,
  .section-title::after {
    content: "";
    height: 1px;
    background: rgba(0, 0, 0, 0.12);
    flex: 1;
    max-width: 260px;
  }
  .section-title span {
    white-space: nowrap;
  }

  .faq {
    text-align: left;
  }
  .q {
    margin: 0 0 0.15rem;
    font-weight: 700;
  }
  .a {
    margin: 0 0 1rem;
  }
  .stack {
    max-width: 560px;
    margin: 0 auto;
  }

  @media (max-width: 820px) {
    .rule-title {
      font-size: 1.7rem;
    }
    .rule-title::before,
    .rule-title::after {
      max-width: 220px;
    }
  }
</style>
