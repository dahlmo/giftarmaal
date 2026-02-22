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
    type Person,
    type PersonRoles,
    type RsvpStatus,
  } from "../lib/api";
  import { generateInviteCode } from "../lib/helpers";

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
    friendlyName: "",
    fullName: "",
    email: "",
    title: "Guest",
    roles: ["GUEST"],
    rsvp: "NO",
    saveTheDateSent: false,
    invitationCode: generateInviteCode(),
  };
  let savingPerson = false;
  let personError = "";

  async function loadPersons() {
    persons = await listPersons();
  }

  async function submitPersonForm() {
    personError = "";
    if (!personForm.friendlyName || !personForm.fullName || !personForm.email) {
      personError = "Fornavn, fullt navn og e-post kreves";
      return;
    }
    savingPerson = true;
    try {
      await addPerson(personForm as any);
      personForm = {
        friendlyName: "",
        fullName: "",
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

  function toggleEditRole(role: PersonRoles) {
    editPerson.roles = editPerson.roles || [];
    if (editPerson.roles.includes(role)) {
      editPerson.roles = editPerson.roles.filter((r) => r !== role);
    } else {
      editPerson.roles = [...editPerson.roles, role];
    }
  }

  async function saveEditPerson(id: string) {
    if (!editPerson.friendlyName || !editPerson.fullName || !editPerson.email) {
      personError = "Fornavn, fullt navn og e-post kreves";
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

  function toggleRole(role: PersonRoles[number]) {
    personForm.roles = personForm.roles || [];
    if (personForm.roles.includes(role))
      personForm.roles = personForm.roles.filter((r) => r !== role);
    else personForm.roles = [...personForm.roles, role];
  }

  // --- BILDE-OPPLASTING FOR PERSONER ---
  let activeImagePersonId: string | null = null;
  let uploadingImageFor: string | null = null;
  let imageUploadError = "";

  function toggleImageUpload(personId: string) {
    imageUploadError = "";
    if (activeImagePersonId === personId) {
      activeImagePersonId = null;
    } else {
      activeImagePersonId = personId;
    }
  }

  async function uploadPersonImage(personId: string, file: File) {
    imageUploadError = "";

    if (!file) return;
    if (!file.type.startsWith("image/")) {
      imageUploadError = "Filen må være et bilde.";
      return;
    }

    try {
      uploadingImageFor = personId;
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`/api/persons/${personId}/image`, {
        method: "PUT",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        imageUploadError =
          text || `Feil ved opplasting (status ${res.status}).`;
        return;
      }

      activeImagePersonId = null;
      await loadPersons();
    } catch (e) {
      imageUploadError =
        e instanceof Error ? e.message : "Ukjent feil ved opplasting.";
    } finally {
      uploadingImageFor = null;
    }
  }

  function handleFileInput(personId: string, event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      void uploadPersonImage(personId, file);
    }
  }

  function handleDrop(personId: string, event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      void uploadPersonImage(personId, file);
    }
  }

  const roles: { label: string; value: PersonRoles[number] }[] = [
    { label: "Gjest", value: "GUEST" },
    { label: "Toastmaster", value: "TOASTMASTER" },
    { label: "Forlover", value: "PERSON_OF_HONOR" },
    { label: "Brud/Brudgom", value: "SPOUSE_TO_BE" },
    { label: "Leverandør", value: "VENDOR" },
  ];
  const rsvpOpts: { label: string; value: RsvpStatus[number] }[] = [
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
      class="person-form"
      on:submit|preventDefault={submitPersonForm}
      autocomplete="off"
    >
      <div class="field-row">
        <div class="field">
          <label>Fornavn</label>
          <input
            placeholder="Fornavn"
            bind:value={personForm.friendlyName}
            required
          />
        </div>
        <div class="field">
          <label>Fullt navn</label>
          <input
            placeholder="OBS! Fullt navn (for utsendinger)"
            bind:value={personForm.fullName}
            required
          />
        </div>
        <div class="field">
          <label>E-post</label>
          <input
            placeholder="E-post"
            type="email"
            bind:value={personForm.email}
            required
          />
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label>Telefon</label>
          <input placeholder="Telefon" bind:value={personForm.phone} />
        </div>
        <div class="field">
          <label>Tittel (på invitasjon)</label>
          <input placeholder="Guest" bind:value={personForm.title} />
        </div>
        <div class="field">
          <label>Invitasjonskode</label>
          <input bind:value={personForm.invitationCode} />
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label>Adresse 1</label>
          <input placeholder="Adresse 1" bind:value={personForm.addressLine1} />
        </div>
        <div class="field field-sm">
          <label>Postnr</label>
          <input placeholder="Postnr" bind:value={personForm.zipcode} />
        </div>
        <div class="field field-sm">
          <label>Sted</label>
          <input placeholder="Sted" bind:value={personForm.city} />
        </div>
        <div class="field field-sm">
          <label>Land</label>
          <input placeholder="Land" bind:value={personForm.country} />
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label>RSVP</label>
          <select bind:value={personForm.rsvp}>
            <option value="NO">RSVP?</option>
            {#each rsvpOpts as o}
              <option value={o.value}>{o.label}</option>
            {/each}
          </select>
        </div>
        <div class="field checkbox-field">
          <label>
            <input type="checkbox" bind:checked={personForm.saveTheDateSent} />
            <span>Save-the-date sendt</span>
          </label>
        </div>
      </div>

      <div class="field">
        <label>Roller</label>
        <div class="chip-row">
          {#each roles as r}
            <label class="chip">
              <input
                type="checkbox"
                value={r.value}
                checked={personForm.roles && personForm.roles.includes(r.value)}
                on:change={() => toggleRole(r.value)}
              />
              <span>{r.label}</span>
            </label>
          {/each}
        </div>
      </div>

      {#if personError}
        <div class="error">{personError}</div>
      {/if}

      <div class="person-form-actions">
        <button type="submit" disabled={savingPerson}>
          {savingPerson ? "Lagrer..." : "Legg til person"}
        </button>
      </div>
    </form>

    <div class="person-list">
      <table class="person-table">
        <thead>
          <tr>
            <th>Navn</th>
            <th>E-post</th>
            <th>Tlf</th>
            <th>Tittel</th>
            <th>Kode</th>
            <th>Adresse</th>
            <th>RSVP</th>
            <th>Save-date</th>
            <th>Roller</th>
            <th>Bilde</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {#each persons as person (person.id)}
            {#if editingId === person.id}
              <tr class="editing-row">
                <td>
                  <input bind:value={editPerson.friendlyName} required />
                  <input bind:value={editPerson.fullName} required />
                </td>
                <td>
                  <input bind:value={editPerson.email} required />
                </td>
                <td>
                  <input bind:value={editPerson.phone} />
                </td>
                <td>
                  <input bind:value={editPerson.title} />
                </td>
                <td>
                  <input bind:value={editPerson.invitationCode} />
                </td>
                <td class="address-cell">
                  <input
                    bind:value={editPerson.addressLine1}
                    placeholder="Adresse 1"
                  />
                  <div class="address-row">
                    <input
                      bind:value={editPerson.zipcode}
                      placeholder="Postnr"
                    />
                    <input bind:value={editPerson.city} placeholder="Sted" />
                    <input bind:value={editPerson.country} placeholder="Land" />
                  </div>
                </td>
                <td>
                  <select bind:value={editPerson.rsvp}>
                    {#each rsvpOpts as o}
                      <option value={o.value}>{o.label}</option>
                    {/each}
                  </select>
                </td>
                <td class="center">
                  <label class="inline-checkbox">
                    <input
                      type="checkbox"
                      bind:checked={editPerson.saveTheDateSent}
                    />
                    <span>Sendt</span>
                  </label>
                </td>
                <td>
                  <div class="chip-column">
                    {#each roles as r}
                      <label class="chip chip-sm">
                        <input
                          type="checkbox"
                          value={r.value}
                          checked={editPerson.roles &&
                            editPerson.roles.includes(r.value)}
                          on:change={() => toggleEditRole(r.value)}
                        />
                        <span>{r.label}</span>
                      </label>
                    {/each}
                  </div>
                </td>
                <!-- tom cel­le for "Bilde" i edit-modus -->
                <td></td>
                <td class="actions">
                  <button
                    class="ghost"
                    type="button"
                    on:click={() => saveEditPerson(person.id)}
                  >
                    Lagre
                  </button>
                  <button class="ghost" type="button" on:click={cancelEdit}>
                    Avbryt
                  </button>
                </td>
              </tr>
            {:else}
              <tr>
                <td>{person.friendlyName}</td>
                <td>{person.email}</td>
                <td>{person.phone}</td>
                <td>{person.title}</td>
                <td>{person.invitationCode}</td>
                <td>
                  {person.addressLine1}, {person.zipcode}
                  {person.city},{" "}
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

                <!-- Bilde-knapp -->
                <td class="center">
                  <button
                    class="ghost icon-btn"
                    type="button"
                    title="Last opp bilde"
                    on:click={() => toggleImageUpload(person.id)}
                  >
                    📸
                  </button>
                </td>

                <td class="actions">
                  <button
                    class="ghost"
                    type="button"
                    title="Rediger"
                    on:click={() => startEdit(person)}
                  >
                    ✎
                  </button>
                  <button
                    class="danger"
                    type="button"
                    title="Slett"
                    on:click={() => doDeletePerson(person.id)}
                  >
                    ✕
                  </button>
                </td>
              </tr>

              {#if activeImagePersonId === person.id}
                <tr class="upload-row">
                  <!-- må matche antall th i thead -->
                  <td colspan="11">
                    <div
                      class="dropzone"
                      on:dragover|preventDefault
                      on:drop={(e) => handleDrop(person.id, e)}
                    >
                      <p>
                        Dra inn et bilde her, eller
                        <label class="file-link">
                          <input
                            type="file"
                            accept="image/*"
                            on:change={(e) => handleFileInput(person.id, e)}
                            hidden
                          />
                          velg fra disk
                        </label>
                      </p>

                      {#if uploadingImageFor === person.id}
                        <p>Laster opp bilde ...</p>
                      {/if}

                      {#if imageUploadError}
                        <p class="error">{imageUploadError}</p>
                      {/if}
                    </div>
                  </td>
                </tr>
              {/if}
            {/if}
          {/each}
        </tbody>
      </table>
    </div>
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
        <button on:click={addPost} disabled={!postText.trim()}>
          Publiser
        </button>
      </div>
    </div>

    <ul class="posts">
      {#each $posts as p (p.id)}
        <li>
          <p>{p.text}</p>
          <small class="muted">
            {new Date(p.createdAt).toLocaleString()}
          </small>
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
    margin: 1rem 0 0.75rem;
  }

  .panel {
    background: #fff;
    border: 1px solid #e8ece8;
    border-radius: 16px;
    padding: 1.25rem 1.5rem 1.5rem;
    margin-bottom: 1.75rem;
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

  /* -------- Gjesteliste: form -------- */

  .person-form {
    display: flex;
    flex-direction: column;
    gap: 0.9rem;
    margin-bottom: 1.25rem;
  }

  .field-row {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .field-sm {
    max-width: 140px;
  }

  .field label {
    font-size: 0.8rem;
    font-weight: 500;
    color: #555;
  }

  .field input,
  .field select {
    padding: 0.45rem 0.6rem;
    border-radius: 10px;
    border: 1px solid #e0e4e0;
    font-size: 0.9rem;
    background: #fdfdfd;
  }

  .field input:focus,
  .field select:focus {
    outline: none;
    border-color: #2f6f5e;
    box-shadow: 0 0 0 1px rgba(47, 111, 94, 0.15);
  }

  .checkbox-field {
    justify-content: flex-end;
  }

  .checkbox-field label {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.9rem;
    font-weight: 400;
  }

  .checkbox-field input {
    width: auto;
  }

  .chip-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.15rem 0.6rem;
    border-radius: 999px;
    border: 1px solid #dbe5df;
    background: #f5faf7;
    font-size: 0.8rem;
  }

  .chip input {
    width: auto;
    margin: 0;
  }

  .chip-sm {
    padding: 0.1rem 0.45rem;
    font-size: 0.75rem;
  }

  .person-form-actions {
    display: flex;
    justify-content: flex-end;
    margin-top: 0.25rem;
  }

  /* -------- Gjesteliste: tabell -------- */

  .person-list {
    margin-top: 0.5rem;
    overflow-x: auto;
  }

  .person-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }

  .person-table th,
  .person-table td {
    padding: 0.5rem 0.4rem;
    border-bottom: 1px solid #eef1ee;
    text-align: left;
    vertical-align: top;
  }

  .person-table th {
    background: #f7fbf9;
    font-weight: 600;
    color: #555;
  }

  .person-table tr:last-child td {
    border-bottom: none;
  }

  .person-table input,
  .person-table select {
    width: 100%;
    box-sizing: border-box;
    padding: 0.35rem 0.5rem;
    border-radius: 8px;
    border: 1px solid #e0e4e0;
    font-size: 0.85rem;
  }

  .address-cell input {
    margin-bottom: 0.25rem;
  }

  .address-row {
    display: flex;
    gap: 0.3rem;
  }

  .address-row input {
    flex: 1;
  }

  .chip-column {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .inline-checkbox {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.8rem;
  }

  .actions {
    white-space: nowrap;
    text-align: right;
  }

  .center {
    text-align: center;
  }

  .editing-row {
    background: #fbfdfc;
  }

  .upload-row td {
    background: #f7fbf9;
    border-bottom: 1px solid #e3ebe5;
  }

  .dropzone {
    border: 1px dashed #b7c4bc;
    border-radius: 12px;
    padding: 0.9rem 1rem;
    text-align: center;
    font-size: 0.9rem;
    color: #4b524d;
    background: rgba(245, 250, 247, 0.9);
  }

  .dropzone p {
    margin: 0.2rem 0;
  }

  .file-link {
    color: #2f6f5e;
    text-decoration: underline;
    cursor: pointer;
    margin-left: 0.15rem;
  }

  .icon-btn {
    padding-inline: 0.5rem;
    font-size: 1.1rem;
    line-height: 1;
  }

  /* -------- Felles UI -------- */

  button {
    padding: 0.5rem 0.9rem;
    border-radius: 999px;
    border: 0;
    background: #2f6f5e;
    color: #fff;
    cursor: pointer;
    font-size: 0.9rem;
  }

  button.ghost {
    background: #eef4f1;
    color: #2f6f5e;
  }

  button.danger {
    background: #dc4b4b;
  }

  button:disabled {
    opacity: 0.6;
    cursor: default;
  }

  select {
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

  @media (max-width: 900px) {
    .field-row {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 640px) {
    .field-row {
      grid-template-columns: minmax(0, 1fr);
    }

    .field-sm {
      max-width: none;
    }

    .address-row {
      flex-direction: column;
    }

    .actions {
      white-space: normal;
    }
  }
</style>
