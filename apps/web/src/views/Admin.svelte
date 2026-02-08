<script lang="ts">
  import { onMount } from "svelte";
  import { writable } from "svelte/store";

  type AgendaItem = {
    id: number;
    time: string;
    title: string;
    detail?: string;
    order: number;
  };
  type Post = { id: number; text: string; createdAt: string };

  const agenda = writable<AgendaItem[]>([]);
  const posts = writable<Post[]>([]);

  let form = { time: "", title: "", detail: "", order: 0 };
  let postText = "";

  async function load() {
    const a = await fetch("/api/agenda").then((r) => r.json());
    agenda.set(a.items ?? []);
    const p = await fetch("/api/posts").then((r) => r.json());
    posts.set(p.posts ?? []);
  }

  async function addAgenda() {
    const res = await fetch("/api/agenda", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      form = { time: "", title: "", detail: "", order: 0 };
      await load();
    }
  }

  async function saveAgenda(item: AgendaItem) {
    await fetch(`/api/agenda/${item.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(item),
    });
  }

  async function removeAgenda(id: number) {
    await fetch(`/api/agenda/${id}`, { method: "DELETE" });
    await load();
  }

  async function move(item: AgendaItem, delta: number) {
    const updated = { ...item, order: item.order + delta };
    await saveAgenda(updated);
    await load();
  }

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

  onMount(load);
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
            bind:value={item.time}
            on:change={() => saveAgenda(item)}
          />
          <input
            class="title"
            bind:value={item.title}
            on:change={() => saveAgenda(item)}
          />
          <input
            class="desc"
            placeholder="Description (optional)"
            bind:value={item.detail}
            on:change={() => saveAgenda(item)}
          />
          <button class="ghost" on:click={() => move(item, -1)}>↑</button>
          <button class="ghost" on:click={() => move(item, 1)}>↓</button>
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
  .time {
    width: 100%;
  }
  .title {
    width: 100%;
  }
  .desc {
    width: 100%;
  }
  button {
    padding: 0.5rem 0.75rem;
    border-radius: 8px;
    border: 0;
    background: #2f6f5e;
    color: #fff;
  }
  button.ghost {
    background: #eef4f1;
    color: #2f6f5e;
  }
  button.danger {
    background: #dc4b4b;
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
  @media (max-width: 760px) {
    .row {
      grid-template-columns: 70px 1fr 1fr auto auto auto;
    }
  }
</style>
