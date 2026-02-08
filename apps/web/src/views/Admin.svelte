<script lang="ts">
  import { onMount } from "svelte";
  import { writable } from "svelte/store";
  import BlocksEditor from "../lib/BlocksEditor.svelte";
  import type { Block } from "../lib/blocks/types";
  import { pageDefs } from "../lib/blocks/pageDefs"; // Bruk denne importen

  type AgendaItem = {
    id: number;
    time: string;
    title: string;
    detail?: string | null;
    order: number;
  };

  type Post = { id: number; text: string; createdAt: string };

  const agenda = writable<AgendaItem[]>([]);
  const posts = writable<Post[]>([]);

  let form: Omit<AgendaItem, "id"> = {
    time: "",
    title: "",
    detail: "",
    order: 0,
  };
  let postText = "";

  // ---- Helpers
  function sanitizeBlocks(blocks: Block[]): Block[] {
    const walk = (b: Block): Block => {
      const data: any = b.data ?? {};
      // if nested blocks live in data.children, sanitize them too
      if (Array.isArray(data.children)) {
        data.children = data.children.map(walk);
      }
      return { ...b, data };
    };
    return (blocks ?? []).map(walk);
  }

  // ---- Data load
  async function load() {
    const a = await fetch("/api/agenda").then((r) => r.json());
    agenda.set(a.items ?? []);

    const p = await fetch("/api/posts").then((r) => r.json());
    posts.set(p.posts ?? []);
  }

  // ---- Agenda CRUD
  function updateAgendaField(id: number, key: keyof AgendaItem, value: any) {
    agenda.update((xs) =>
      xs.map((x) => (x.id === id ? { ...x, [key]: value } : x)),
    );
  }

  async function addAgenda() {
    const payload = { ...form, detail: (form.detail ?? "").trim() || null };
    const res = await fetch("/api/agenda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      form = { time: "", title: "", detail: "", order: 0 };
      await load();
    }
  }

  async function saveAgenda(item: AgendaItem) {
    const { id, ...data } = item;
    await fetch(`/api/agenda/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        detail: (data.detail ?? "").toString().trim() || null,
      }),
    });
  }

  async function removeAgenda(id: number) {
    await fetch(`/api/agenda/${id}`, { method: "DELETE" });
    await load();
  }

  // Better move: swap positions in local list, renumber orders, then persist changed ones
  async function moveById(id: number, delta: number) {
    let snapshot: AgendaItem[] = [];
    const unsub = agenda.subscribe((xs) => (snapshot = xs));
    unsub();

    const idx = snapshot.findIndex((x) => x.id === id);
    const to = idx + delta;
    if (idx < 0 || to < 0 || to >= snapshot.length) return;

    const copy = [...snapshot];
    const [moved] = copy.splice(idx, 1);
    copy.splice(to, 0, moved);

    // Renumber to avoid duplicates and keep stable ordering
    const renumbered = copy.map((x, i) => ({ ...x, order: i }));

    agenda.set(renumbered);

    // Persist only the two-ish items that changed (safe: persist all orders if you want)
    const changed = renumbered.filter((x, i) => x.order !== snapshot[i]?.order);
    await Promise.all(changed.map((x) => saveAgenda(x)));
    await load();
  }

  // ---- Posts
  async function addPost() {
    if (!postText.trim()) return;
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: postText.trim() }),
    });
    if (res.ok) {
      postText = "";
      await load();
    }
  }

  // ---- Pages/Blocks panel

  let pageSlug = "praktisk";
  let pageBlocks: Block[] = [];

  let pagesLoading = true;
  let pagesSaving = false;
  let pagesError: string | null = null;
  let pagesSavedAt: string | null = null;

  async function loadPage() {
    pagesLoading = true;
    pagesError = null;
    pagesSavedAt = null;

    try {
      const res = await fetch(`/api/content/${pageSlug}`);
      if (!res.ok) throw new Error("Kunne ikke laste sideinnhold.");
      const json = await res.json();

      // accept both shapes: {blocks} or {data:{blocks}}
      const blocks = (json?.blocks ?? json?.data?.blocks ?? []) as Block[];
      pageBlocks = sanitizeBlocks(blocks);
    } catch (e) {
      pagesError = e instanceof Error ? e.message : "Ukjent feil";
      pageBlocks = [];
    } finally {
      pagesLoading = false;
    }
  }

  async function savePageDraft() {
    pagesSaving = true;
    pagesError = null;
    try {
      const blocks = sanitizeBlocks(pageBlocks);

      const res = await fetch(`/api/content/${pageSlug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // IMPORTANT: send under "data" so backend doesn't complain about missing data
        body: JSON.stringify({
          title: pageSlug,
          data: { blocks },
        }),
      });

      if (!res.ok) throw new Error("Kunne ikke lagre utkast.");
      pagesSavedAt = new Date().toLocaleTimeString();
    } catch (e) {
      pagesError = e instanceof Error ? e.message : "Ukjent feil";
    } finally {
      pagesSaving = false;
    }
  }

  onMount(async () => {
    await load();
    await loadPage();
  });
</script>

<section class="wrap">
  <h1>Handtere</h1>

  <div class="panel">
    <h2>Program/Agenda</h2>
    <div class="list">
      {#each $agenda as item (item.id)}
        <div class="row">
          <input
            class="time"
            value={item.time}
            on:input={(e) => updateAgendaField(item.id, "time", e.target.value)}
            on:change={() => saveAgenda(item)}
          />
          <input
            class="title"
            value={item.title}
            on:input={(e) =>
              updateAgendaField(item.id, "title", e.target.value)}
            on:change={() => saveAgenda(item)}
          />
          <input
            class="desc"
            placeholder="Description (optional)"
            value={item.detail ?? ""}
            on:input={(e) =>
              updateAgendaField(item.id, "detail", e.target.value)}
            on:change={() => saveAgenda(item)}
          />
          <button class="ghost" on:click={() => moveById(item.id, -1)}>↑</button
          >
          <button class="ghost" on:click={() => moveById(item.id, 1)}>↓</button>
          <button class="danger" on:click={() => removeAgenda(item.id)}
            >Slett</button
          >
        </div>
      {/each}
    </div>

    <div class="row add">
      <input class="time" placeholder="13:30" bind:value={form.time} />
      <input class="title" placeholder="Tittel" bind:value={form.title} />
      <input class="desc" placeholder="Beskrivelse" bind:value={form.detail} />
      <button on:click={addAgenda}>Legg til</button>
    </div>
  </div>

  <div class="panel">
    <h2>Oppdateringer/Feed</h2>
    <div class="post-form">
      <textarea
        rows="3"
        maxlength="280"
        placeholder="Skriv en kort oppdatering (max 280 tegn)"
        bind:value={postText}
      ></textarea>
      <div class="form-actions">
        <span class="muted">{postText.length}/280</span>
        <button on:click={addPost} disabled={!postText.trim()}>Publiser</button>
      </div>
    </div>

    <ul class="posts">
      {#each $posts as p (p.id)}
        <li>
          <p>{p.text}</p>
          <small class="muted">{new Date(p.createdAt).toLocaleString()}</small>
        </li>
      {/each}
    </ul>
  </div>

  <div class="panel">
    <div class="panel-head">
      <h2>Sider (blocks)</h2>

      <div class="panel-actions">
        <select bind:value={pageSlug} on:change={loadPage}>
          <option value="praktisk">Praktisk info</option>
          <option value="program">Program</option>
          <option value="kontakt">Kontakt</option>
        </select>

        <button
          class="ghost"
          on:click={loadPage}
          disabled={pagesLoading || pagesSaving}
        >
          Last
        </button>
        <button on:click={savePageDraft} disabled={pagesLoading || pagesSaving}>
          {pagesSaving ? "Lagrer..." : "Lagre utkast"}
        </button>
      </div>
    </div>

    {#if pagesSavedAt}
      <div class="hint">Lagret {pagesSavedAt}</div>
    {/if}
    {#if pagesError}
      <div class="error">{pagesError}</div>
    {/if}

    {#if pagesLoading}
      <div>Laster sideinnhold ...</div>
    {:else}
      <BlocksEditor bind:value={pageBlocks} defs={pageDefs} />

      <div class="save-row">
        <button on:click={savePageDraft} disabled={pagesSaving}>
          {pagesSaving ? "Lagrer..." : "Lagre utkast"}
        </button>
      </div>
    {/if}
  </div>
</section>

<style>
  .wrap {
    max-width: 900px;
    margin: 2rem auto;
    padding: 0 1rem;
  }
  h1 {
    font-size: 1.6rem;
    margin-bottom: 1rem;
  }
  h2 {
    font-size: 1.2rem;
    margin: 1rem 0 0.5rem;
  }

  .panel {
    background: #fff;
    border: 1px solid #e8ece8;
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .panel-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .panel-actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .list {
    display: grid;
    gap: 0.5rem;
  }
  .row {
    display: grid;
    grid-template-columns: 90px 1fr 1.2fr auto auto auto;
    gap: 0.5rem;
    align-items: center;
  }
  .row input {
    padding: 0.5rem 0.6rem;
    border: 1px solid #e0e4e0;
    border-radius: 8px;
  }
  .row.add {
    margin-top: 0.75rem;
  }

  button {
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    border: 0;
    background: #2f6f5e;
    color: #fff;
    cursor: pointer;
  }
  button.ghost {
    background: #eef4f1;
    color: #2f6f5e;
  }
  button.danger {
    background: #dc4b4b;
  }

  select {
    padding: 0.45rem 0.6rem;
    border: 1px solid #e0e4e0;
    border-radius: 8px;
    background: #fff;
  }

  .post-form textarea {
    width: 100%;
    padding: 0.6rem 0.7rem;
    border: 1px solid #e0e4e0;
    border-radius: 8px;
    resize: vertical;
  }
  .form-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.5rem;
  }

  .posts {
    list-style: none;
    padding: 0;
    margin: 0.75rem 0 0;
    display: grid;
    gap: 0.5rem;
  }
  .posts li {
    background: #f7fbf9;
    border: 1px solid #e8ece8;
    border-radius: 10px;
    padding: 0.6rem 0.7rem;
  }

  .muted {
    color: #6e756f;
  }
  .hint {
    margin-top: 0.35rem;
    color: #2f6f5e;
    font-size: 0.9rem;
  }
  .error {
    margin-top: 0.35rem;
    color: #dc4b4b;
    font-size: 0.95rem;
  }

  .save-row {
    margin-top: 0.9rem;
    display: flex;
    justify-content: flex-end;
  }

  @media (max-width: 760px) {
    .row {
      grid-template-columns: 70px 1fr 1fr auto auto auto;
    }
  }
</style>
