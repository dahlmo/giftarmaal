<script lang="ts">
  import type { Block } from "./blocks/types";

  export let blocks: Block[] = [];

  function cls(layout?: any) {
    const w = layout?.width ?? "content";
    const a = layout?.align ?? "center";
    return `w-${w} a-${a}`;
  }

  type AgendaItem = {
    date: string;
    time: string;
    title: string;
    detail?: string;
  };

  function groupAgenda(items: AgendaItem[]) {
    const map = new Map<string, AgendaItem[]>();

    for (const it of items ?? []) {
      const key = String(it?.date ?? "").slice(0, 10); // YYYY-MM-DD
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }

    // sorter datoer
    const days = Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, its]) => ({
        key,
        items: its
          .slice()
          .sort((x, y) => String(x.time).localeCompare(String(y.time))),
      }));

    return days;
  }

  const nbWeekdays = [
    "SØNDAG",
    "MANDAG",
    "TIRSDAG",
    "ONSDAG",
    "TORSDAG",
    "FREDAG",
    "LØRDAG",
  ];
  const nbMonths = [
    "JANUAR",
    "FEBRUAR",
    "MARS",
    "APRIL",
    "MAI",
    "JUNI",
    "JULI",
    "AUGUST",
    "SEPTEMBER",
    "OKTOBER",
    "NOVEMBER",
    "DESEMBER",
  ];

  function formatDayTitle(isoDate: string) {
    // isoDate: YYYY-MM-DD
    const [y, m, d] = isoDate.split("-").map((x) => Number(x));
    const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
    const weekday = nbWeekdays[dt.getUTCDay()];
    const month = nbMonths[(m ?? 1) - 1] ?? "";
    return `${weekday} ${d}. ${month}`;
  }

  const iconAlert = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"
      xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 
              10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
    </svg>`;
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
      {@const html = (b.data?.text ?? "")
        .replace(/\r\n/g, "\n")
        .replace(/\r/g, "\n")
        .replace(/\n/g, "<br>")}
      <div class="prose">{@html html}</div>
    {:else if b.type === "cta"}
      {#if b.data?.href}
        <a class="cta" href={b.data.href} rel="noopener noreferrer">
          {b.data?.label ?? "Les mer"}
        </a>
      {/if}
    {:else if b.type === "grid"}
      {@const cols = Number(b.data?.columns ?? 3)}
      <div
        class="grid grid-tight"
        style={"grid-template-columns: repeat(" + (cols || 3) + ", auto)"}
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
        <h2 class="rule-title">{b.data.title}</h2>
      {/if}
      <div class="faq">
        {#each b.data?.items ?? [] as qa, idx (idx)}
          <div class="qa">
            <p class="q">{qa?.q ?? ""}</p>
            <p class="a">{qa?.a ?? ""}</p>
          </div>
        {/each}
      </div>
    {:else if b.type === "agenda"}
      <div class="agenda">
        {#each groupAgenda(b.data?.items ?? []) as day (day.key)}
          <section class="agenda-day">
            <h3 class="agenda-day-title">{formatDayTitle(day.key)}</h3>
            <div class="agenda-day-divider"></div>

            <ul class="agenda-list">
              {#each day.items as item, idx (idx)}
                <li class="agenda-item">
                  <div class="agenda-time">{item.time}</div>

                  <div class="agenda-text">
                    <div class="agenda-title">{item.title}</div>
                    {#if item.detail}
                      <div class="agenda-detail">{item.detail}</div>
                    {/if}
                  </div>
                </li>
              {/each}
            </ul>
          </section>
        {/each}
      </div>
    {:else if b.type === "section"}
      {#if b.data?.title}
        <h2 class="rule-title"><span>{b.data.title}</span></h2>
      {/if}
      <div class="stack">
        <svelte:self blocks={b.data?.children ?? []} />
      </div>
    {:else if b.type === "divider"}
      <hr class="divider" />
    {:else if b.type === "spacer"}
      {@const size = b.data?.size ?? "md"}
      <div class={"spacer " + size}></div>
    {:else if b.type === "infobox"}
      <div class="infobox">
        <div class="info-head">
          {@html iconAlert}
          <div class="info-title">{@html b.data?.title}</div>
        </div>

        <div class="info-divider"></div>

        <p class="info-body">
          {@html b.data?.body ?? ""}
        </p>

        {#if b.data?.spoilerText}
          <details class="info-details">
            <summary>{b.data?.spoilerLabel ?? "+ Vis mer"}</summary>
            <div class="info-spoiler">{@html b.data?.spoilerText}</div>
          </details>
        {/if}
      </div>
    {/if}
  </section>
{/each}

<style>
  .block {
    margin: 2rem 0;
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
    margin: 6.4rem 0 4.4rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.15rem;

    font-family: "Montserrat", sans-serif;
    font-weight: 300;
    text-transform: uppercase;
    letter-spacing: 0.34em;

    font-size: 1.55rem; /* matcher høyre */
    line-height: 1.1;
    color: #413f40;

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
    margin: 0rem 0;
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
    gap: 3rem;
  }
  .card {
    padding: 0.8rem;
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

  .cta {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    padding: 0.9rem 2.4rem;
    border-radius: 999px;

    background: #d8ccbf; /* lys beige */
    color: rgba(42, 42, 42, 0.85);

    font-family: "Montserrat", sans-serif;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    font-size: 0.85rem;

    text-decoration: none;
    box-shadow: 0 14px 26px rgba(0, 0, 0, 0.08);

    margin: 1.6rem auto 1.2rem;
    cursor: pointer;

    transition:
      filter 0.2s ease,
      transform 0.2s ease;
  }

  .cta:hover {
    filter: brightness(0.96);
    transform: translateY(-1px);
  }

  .cta:active {
    filter: brightness(0.92);
    transform: translateY(0);
  }

  .infobox {
    margin: 2rem auto;
    max-width: 820px;

    background: rgba(247, 246, 242, 0.9);
    border-radius: 38px;

    padding: 1.4rem 1.7rem 1.6rem;
    box-shadow: 0 26px 44px rgba(0, 0, 0, 0.1);

    font-family: "Montserrat", sans-serif;
    color: rgba(42, 42, 42, 0.9);
    text-align: center;
  }

  /* header */
  .info-head {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.65rem;
    flex-wrap: wrap;
    margin-top: 0.2rem;
  }

  .info-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 26px;
    height: 26px;

    border-radius: 999px;
    background: rgba(42, 42, 42, 0.08);
    color: rgba(42, 42, 42, 0.85);

    font-weight: 800;
    font-size: 1rem;
    line-height: 1;
  }

  .info-title {
    font-size: 1.15rem;
    font-weight: 500;
    letter-spacing: 0.01em;
  }

  .info-title b,
  .info-title strong {
    font-weight: 800;
  }

  /* dotted divider */
  .info-divider {
    margin: 0.95rem auto 1.1rem;
    max-width: 780px;
    border-top: 2px dotted rgba(42, 42, 42, 0.24);
  }

  /* body text */
  .info-body {
    margin: 0 0 1rem;
    font-size: 0.95rem;
    line-height: 1.55;
    color: rgba(42, 42, 42, 0.75);
  }

  /* spoiler details */
  .info-details {
    margin-top: 0.5rem;
  }

  .info-details summary {
    cursor: pointer;
    font-weight: 700;
    font-size: 0.95rem;
    color: rgba(42, 42, 42, 0.7);
    text-decoration: underline;
    text-underline-offset: 3px;
    list-style: none;
  }

  .info-details summary::-webkit-details-marker {
    display: none;
  }

  .info-spoiler {
    margin-top: 0.7rem;
    font-size: 0.9rem;
    color: rgba(42, 42, 42, 0.75);
    line-height: 1.5;
  }

  /* ===== Agenda (program) ===== */
  .agenda {
    margin: 3.2rem 0 4.6rem;
    font-family: "Montserrat", sans-serif;
    color: rgba(42, 42, 42, 0.82);
  }

  .agenda-day {
    margin: 3.4rem 0 5rem;
  }

  .agenda-day-title {
    margin: 0;
    text-align: center;

    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 0.34em;

    font-size: 1.65rem;
    line-height: 1.1;
    color: rgba(42, 42, 42, 0.85);
  }

  .agenda-day-divider {
    margin: 1.25rem auto 0;
    max-width: 760px;
    border-top: 2px dotted rgba(42, 42, 42, 0.24);
  }

  /* list wrapper */
  .agenda-list {
    list-style: none;
    padding: 0;
    margin: 1.6rem auto 0;
    max-width: 760px;
  }

  /* each row */
  .agenda-item {
    display: grid;
    grid-template-columns: 120px 1fr;
    column-gap: 2.2rem;

    padding: 1.35rem 0;
    align-items: start;

    border-top: 2px dotted rgba(42, 42, 42, 0.24);
  }

  .agenda-item:first-child {
    border-top: 0;
    padding-top: 0.85rem;
  }

  /* left column (time) */
  .agenda-time {
    font-size: 1.2rem;
    font-weight: 400;
    letter-spacing: 0.02em;
    color: rgba(42, 42, 42, 0.72);
  }

  /* right column text */
  .agenda-text {
    text-align: left;
  }

  .agenda-title {
    font-size: 1.28rem;
    font-weight: 400;
    line-height: 1.35;
    color: rgba(42, 42, 42, 0.75);
  }

  .agenda-detail {
    margin-top: 0.4rem;
    font-size: 1.28rem;
    font-weight: 400;
    line-height: 1.35;
    color: rgba(42, 42, 42, 0.75);
  }

  /* If you want bold emphasis inside title/detail */
  .agenda-title strong,
  .agenda-detail strong,
  .agenda-title b,
  .agenda-detail b {
    font-weight: 700;
    color: rgba(42, 42, 42, 0.82);
  }

  /* responsive */
  @media (max-width: 560px) {
    .infobox {
      border-radius: 28px;
      padding: 1.2rem 1.1rem 1.1rem;
    }
    .info-title {
      font-size: 1rem;
    }
  }
  @media (max-width: 820px) {
    .rule-title {
      font-size: 1.7rem;
    }
    .rule-title::before,
    .rule-title::after {
      max-width: 220px;
    }
    .agenda-day-title {
      font-size: 1.25rem;
      letter-spacing: 0.28em;
    }

    .agenda-day-divider,
    .agenda-list {
      max-width: 92vw;
    }

    .agenda-item {
      grid-template-columns: 88px 1fr;
      column-gap: 1.2rem;
      padding: 1.05rem 0;
    }

    .agenda-time {
      font-size: 1.05rem;
    }

    .agenda-title,
    .agenda-detail {
      font-size: 1.05rem;
    }
  }
</style>
