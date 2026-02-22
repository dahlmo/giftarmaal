<script lang="ts">
  import SimpleWysiwyg from "../lib/SimpleWysiwyg.svelte";
  import { onMount } from "svelte";
  import { writable } from "svelte/store";
  import BlocksEditor from "../lib/BlocksEditor.svelte";
  import type { Block } from "../lib/blocks/types";
  import { pageDefs } from "../lib/blocks/pageDefs";
  import {
    listPersons,
    addPerson,
    updatePerson,
    deletePerson,
  } from "../lib/api";
  import type { Person, PersonRole, RsvpStatus } from "../lib/api";

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

  function sanitizeBlocks(blocks: Block[]): Block[] {
    const walk = (b: Block): Block => {
      const data: any = b.data ?? {};
      if (Array.isArray(data.children)) {
        data.children = data.children.map(walk);
      }
      return { ...b, data };
    };
    return (blocks ?? []).map(walk);
  }

  async function load() {
    const a = await fetch("/api/agenda").then((r) => r.json());
    agenda.set(a.items ?? []);

    const p = await fetch("/api/posts").then((r) => r.json());
    posts.set(p.posts ?? []);
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

  // ----------- PERSONS CRUD -----------
  let persons: Person[] = [];
  let personForm: Partial<Omit<Person, "id" | "createdAt" | "updatedAt">> = {
    firstName: "",
    lastName: "",
    email: "",
    title: "Guest",
    roles: ["GUEST"],
    rsvp: "NO",
    saveTheDateSent: false,
  };
  let savingPerson = false;
  let personError = "";
  async function loadPersons() {
    persons = await listPersons();
  }
  async function submitPersonForm() {
    personError = "";
    if (!personForm.firstName || !personForm.lastName || !personForm.email) {
      personError = "Fornavn, etternavn og e-post kreves";
      return;
    }
    savingPerson = true;
    try {
      await addPerson(personForm as any);
      personForm = {
        firstName: "",
        lastName: "",
        title: "Guest",
        email: "",
        roles: ["GUEST"],
        rsvp: "NO",
        saveTheDateSent: false,
      };
      await loadPersons();
    } catch (e) {
      personError = e instanceof Error ? e.message : "Kunne ikke lagre";
    }
    savingPerson = false;
  }

  // --- EDIT-MODUS FOR PERSONER ---
  let editingId: string | null = null;
  let editPerson: Partial<Omit<Person, "createdAt" | "updatedAt">> = {};

  function startEdit(person: Person) {
    editingId = person.id;
    editPerson = { ...person };
  }

  function cancelEdit() {
    editingId = null;
    editPerson = {};
  }

  function toggleEditRole(role: PersonRole) {
    editPerson.roles = editPerson.roles || [];
    if (editPerson.roles.includes(role)) {
      editPerson.roles = editPerson.roles.filter((r) => r !== role);
    } else {
      editPerson.roles = [...editPerson.roles, role];
    }
  }

  async function saveEditPerson(id: string) {
    if (!editPerson.firstName || !editPerson.lastName || !editPerson.email) {
      personError = "Fornavn, etternavn og e-post kreves";
      return;
    }
    personError = "";
    await updatePerson(id, editPerson as any);
    editingId = null;
    editPerson = {};
    await loadPersons();
  }

  async function doDeletePerson(id: string) {
    await deletePerson(id);
    await loadPersons();
  }
  function toggleRole(role: PersonRole) {
    personForm.roles = personForm.roles || [];
    if (personForm.roles.includes(role))
      personForm.roles = personForm.roles.filter((r) => r !== role);
    else personForm.roles = [...personForm.roles, role];
  }
  const roles: { label: string; value: PersonRole }[] = [
    { label: "Gjest", value: "GUEST" },
    { label: "Toastmaster", value: "TOASTMASTER" },
    { label: "Hedersperson", value: "PERSON_OF_HONOR" },
    { label: "Forelder", value: "PARENT" },
    { label: "Leverandør", value: "VENDOR" },
  ];
  const rsvpOpts: { label: string; value: RsvpStatus }[] = [
    { label: "Kommer", value: "YES" },
    { label: "Kommer ikke", value: "NO" },
  ];

  onMount(async () => {
    await load();
    await loadPersons();
    await loadPage();
  });
</script>

<section class="wrap">
  <h1>Handtere</h1>

  <!-- Gjesteliste/Persons panel -->
  <div class="panel">
    <h2>Gjesteliste</h2>
    <form
      class="row add"
      on:submit|preventDefault={submitPersonForm}
      autocomplete="off"
    >
      <input
        placeholder="Fornavn"
        bind:value={personForm.firstName}
        required
        size="8"
      />
      <input
        placeholder="Etternavn"
        bind:value={personForm.lastName}
        required
        size="10"
      />
      <input
        placeholder="E-post"
        bind:value={personForm.email}
        required
        size="14"
      />
      <input placeholder="Telefon" bind:value={personForm.phone} size="10" />
      <input placeholder="Tittel" bind:value={personForm.title} size="10" />
      <input
        placeholder="Kode"
        bind:value={personForm.invitationCode}
        size="8"
      />
      <input
        placeholder="Adresse 1"
        bind:value={personForm.addressLine1}
        size="12"
      />
      <input placeholder="Postnr" bind:value={personForm.zipcode} size="5" />
      <input placeholder="Sted" bind:value={personForm.city} size="10" />
      <input placeholder="Land" bind:value={personForm.country} size="8" />
      <select bind:value={personForm.rsvp}>
        <option value="NO">RSVP?</option>
        {#each rsvpOpts as o}
          <option value={o.value}>{o.label}</option>
        {/each}
      </select>
      <label>
        <input type="checkbox" bind:checked={personForm.saveTheDateSent} /> Save-the-date
        sendt
      </label>
      <div style="min-width: 130px">
        {#each roles as r}
          <label style="margin:0 4px 0 0;font-weight:400;font-size:12px;">
            <input
              type="checkbox"
              value={r.value}
              checked={personForm.roles && personForm.roles.includes(r.value)}
              on:change={() => toggleRole(r.value)}
            />
            {r.label}
          </label>
        {/each}
      </div>
      <button type="submit" disabled={savingPerson}>Legg til</button>
    </form>
    {#if personError}<div class="error">{personError}</div>{/if}

    <table style="margin-top: 1.2rem; width: 100%; border-collapse: collapse">
      <thead>
        <tr style="background: #f7fbf9">
          <th>Navn</th><th>E-post</th><th>Tlf</th><th>Tittel</th><th>Kode</th>
          <th>Adresse</th><th>RSVP</th><th>Save-Date</th><th>Roller</th><th
          ></th>
        </tr>
      </thead>
      <tbody>
        {#each persons as person (person.id)}
          {#if editingId === person.id}
            <tr>
              <td>
                <input bind:value={editPerson.firstName} size="7" required />
                <input bind:value={editPerson.lastName} size="8" required />
              </td>
              <td><input bind:value={editPerson.email} size="14" required /></td
              >
              <td><input bind:value={editPerson.phone} size="8" /></td>
              <td><input bind:value={editPerson.title} size="8" /></td>
              <td><input bind:value={editPerson.invitationCode} size="8" /></td>
              <td>
                <input
                  bind:value={editPerson.addressLine1}
                  placeholder="Adresse 1"
                  size="11"
                />
                <input
                  bind:value={editPerson.zipcode}
                  placeholder="Postnr"
                  size="5"
                />
                <input
                  bind:value={editPerson.city}
                  placeholder="Sted"
                  size="8"
                />
                <input
                  bind:value={editPerson.country}
                  placeholder="Land"
                  size="7"
                />
              </td>
              <td>
                <select bind:value={editPerson.rsvp}>
                  {#each rsvpOpts as o}
                    <option value={o.value}>{o.label}</option>
                  {/each}
                </select>
              </td>
              <td>
                <input
                  type="checkbox"
                  bind:checked={editPerson.saveTheDateSent}
                /> Sendt
              </td>
              <td>
                {#each roles as r}
                  <label style="margin: 0 4px 0 0; font-size:11px;">
                    <input
                      type="checkbox"
                      value={r.value}
                      checked={editPerson.roles &&
                        editPerson.roles.includes(r.value)}
                      on:change={() => toggleEditRole(r.value)}
                    />{r.label}
                  </label>
                {/each}
              </td>
              <td>
                <button class="ghost" on:click={() => saveEditPerson(person.id)}
                  >Lagre</button
                >
                <button class="ghost" on:click={cancelEdit}>Avbryt</button>
              </td>
            </tr>
          {:else}
            <tr>
              <td>{person.firstName} {person.lastName}</td>
              <td>{person.email}</td>
              <td>{person.phone}</td>
              <td>{person.title}</td>
              <td>{person.invitationCode}</td>
              <td>
                {person.addressLine1}, {person.zipcode}
                {person.city}
                {person.country}
              </td>
              <td>{person.rsvp === "YES" ? "Ja" : "Nei"}</td>
              <td>{person.saveTheDateSent ? "Ja" : "Nei"}</td>
              <td>
                {person.roles &&
                  person.roles
                    .map((r) => roles.find((x) => x.value === r)?.label)
                    .join(", ")}
              </td>
              <td>
                <button
                  class="ghost"
                  title="Rediger"
                  on:click={() => startEdit(person)}>✎</button
                >
                <button
                  class="danger"
                  title="Slett"
                  on:click={() => doDeletePerson(person.id)}>✕</button
                >
              </td>
            </tr>
          {/if}
        {/each}
      </tbody>
    </table>
  </div>

  <div class="panel">
    <h2>Oppdateringer/Feed</h2>
    <div class="post-form">
      <SimpleWysiwyg
        bind:value={postText}
        placeholder="Skriv en kort oppdatering (bold/italic + linjeskift)"
        maxLength={280}
      />
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
    max-width: 1200px;
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
