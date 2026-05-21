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

  function timeAgo(dateStr: string | null | undefined): string {
    if (!dateStr) return "—";
    const now = Date.now();
    const then = new Date(dateStr).getTime();
    const diffSec = Math.floor((now - then) / 1000);
    if (diffSec < 60) return "nå";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} min siden`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24)
      return `${diffHours} ${diffHours === 1 ? "time" : "timer"} siden`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7)
      return `${diffDays} ${diffDays === 1 ? "dag" : "dager"} siden`;
    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 5)
      return `${diffWeeks} ${diffWeeks === 1 ? "uke" : "uker"} siden`;
    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} ${diffMonths === 1 ? "måned" : "måneder"} siden`;
  }

  function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleString("nb-NO");
  }

  type AgendaItem = {
    id: number;
    time: string;
    title: string;
    detail?: string | null;
    order: number;
  };

  type BookingAdminEntry = {
    slug: string;
    bookableSlots: number | null;
    bookedCount: number;
    bookings: {
      personId: string;
      personName: string;
      status: string;
      createdAt: string;
      lastUpdatedAt: string;
    }[];
  };

  function formatEntrySlug(slug: string): string {
    const [date, time] = slug.split("_");
    if (!date || !time) return slug;
    return `${date} kl. ${time}`;
  }

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

  type PersonGroup = { key: string; members: Person[] };

  $: personGroups = (() => {
    const map = new Map<string, Person[]>();
    for (const p of persons) {
      const key = p.invitationCode || p.id;
      map.set(key, [...(map.get(key) ?? []), p]);
    }
    return [...map.entries()].map(([key, members]) => ({
      key,
      members,
    })) as PersonGroup[];
  })();

  function toggleRole(role: PersonRoles) {
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

  const roles: { label: string; value: PersonRoles }[] = [
    { label: "Gjest", value: "GUEST" },
    { label: "Toastmaster", value: "TOASTMASTER" },
    { label: "Forlover", value: "PERSON_OF_HONOR" },
    { label: "Brud/Brudgom", value: "SPOUSE_TO_BE" },
    { label: "Leverandør", value: "VENDOR" },
    { label: "CIO", value: "CIO" },
  ];
  const rsvpOpts: { label: string; value: RsvpStatus[number] }[] = [
    { label: "Kommer", value: "YES" },
    { label: "Kommer ikke", value: "NO" },
  ];

  let programBookings: BookingAdminEntry[] = [];
  let programBookingsLoading = false;
  let programBookingsError: string | null = null;

  async function loadProgramBookings() {
    programBookingsLoading = true;
    programBookingsError = null;
    try {
      const res = await fetch("/api/program-entries/bookings");
      if (!res.ok) throw new Error("Kunne ikke hente påmeldinger");
      programBookings = await res.json();
    } catch (e) {
      programBookingsError = e instanceof Error ? e.message : "Ukjent feil";
    } finally {
      programBookingsLoading = false;
    }
  }

  onMount(async () => {
    await load();
    await loadPersons();
    await loadPage();
    await loadProgramBookings();
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
          <label for="field-friendlyName">Fornavn</label>
          <input
            id="field-friendlyName"
            placeholder="Fornavn"
            bind:value={personForm.friendlyName}
            required
          />
        </div>
        <div class="field">
          <label for="field-fullName">Fullt navn</label>
          <input
            id="field-fullName"
            placeholder="OBS! Fullt navn (for utsendinger)"
            bind:value={personForm.fullName}
            required
          />
        </div>
        <div class="field">
          <label for="field-email">E-post</label>
          <input
            id="field-email"
            placeholder="E-post"
            type="email"
            bind:value={personForm.email}
            required
          />
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label for="field-phone">Telefon</label>
          <input
            id="field-phone"
            placeholder="Telefon"
            bind:value={personForm.phone}
          />
        </div>
        <div class="field">
          <label for="field-title">Tittel (på invitasjon)</label>
          <input
            id="field-title"
            placeholder="Guest"
            bind:value={personForm.title}
          />
        </div>
        <div class="field">
          <label for="field-invitationCode">Invitasjonskode</label>
          <input
            id="field-invitationCode"
            bind:value={personForm.invitationCode}
          />
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label for="field-addressLine1">Adresse 1</label>
          <input
            id="field-addressLine1"
            placeholder="Adresse 1"
            bind:value={personForm.addressLine1}
          />
        </div>
        <div class="field field-sm">
          <label for="field-zipcode">Postnr</label>
          <input
            id="field-zipcode"
            placeholder="Postnr"
            bind:value={personForm.zipcode}
          />
        </div>
        <div class="field field-sm">
          <label for="field-city">Sted</label>
          <input
            id="field-city"
            placeholder="Sted"
            bind:value={personForm.city}
          />
        </div>
        <div class="field field-sm">
          <label for="field-country">Land</label>
          <input
            id="field-country"
            placeholder="Land"
            bind:value={personForm.country}
          />
        </div>
      </div>

      <div class="field-row">
        <div class="field">
          <label for="field-rsvp">RSVP</label>
          <select id="field-rsvp" bind:value={personForm.rsvp}>
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
        <span class="field-group-label">Roller</span>
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
      <div class="person-cols-header">
        <span>Navn</span>
        <span>RSVP</span>
        <span></span>
        <span></span>
        <span>Tlf · Allergi · Sist sett</span>
      </div>

      <div class="person-groups">
        {#each personGroups as group (group.key)}
          <div class="person-group">
            {#each group.members as person (person.id)}
              {#if editingId === person.id}
                <div class="editing-row">
                  <div class="edit-grid">
                    <div class="edit-row">
                      <div class="edit-field">
                        <label
                          >Fornavn<input
                            bind:value={editPerson.friendlyName}
                            required
                          /></label
                        >
                      </div>
                      <div class="edit-field">
                        <label
                          >Fullt navn<input
                            bind:value={editPerson.fullName}
                            required
                          /></label
                        >
                      </div>
                      <div class="edit-field">
                        <label
                          >E-post<input
                            bind:value={editPerson.email}
                            required
                          /></label
                        >
                      </div>
                      <div class="edit-field">
                        <label
                          >Telefon<input bind:value={editPerson.phone} /></label
                        >
                      </div>
                    </div>
                    <div class="edit-row">
                      <div class="edit-field">
                        <label
                          >Tittel<input bind:value={editPerson.title} /></label
                        >
                      </div>
                      <div class="edit-field">
                        <label
                          >Invitasjonskode<input
                            bind:value={editPerson.invitationCode}
                          /></label
                        >
                      </div>
                      <div class="edit-field">
                        <label
                          >RSVP
                          <select bind:value={editPerson.rsvp}>
                            {#each rsvpOpts as o}
                              <option value={o.value}>{o.label}</option>
                            {/each}
                          </select>
                        </label>
                      </div>
                      <div class="edit-field">
                        <label class="inline-checkbox">
                          <input
                            type="checkbox"
                            bind:checked={editPerson.saveTheDateSent}
                          />
                          <span>Save-the-date sendt</span>
                        </label>
                      </div>
                    </div>
                    <div class="edit-row">
                      <div class="edit-field">
                        <label
                          >Diettbehov<input
                            bind:value={editPerson.dietary}
                            placeholder="Ingen"
                          /></label
                        >
                      </div>
                    </div>
                    <div class="edit-row">
                      <div class="edit-field">
                        <label
                          >Adresse<input
                            bind:value={editPerson.addressLine1}
                            placeholder="Adresse 1"
                          /></label
                        >
                      </div>
                      <div class="edit-field edit-field-sm">
                        <label
                          >Postnr<input
                            bind:value={editPerson.zipcode}
                          /></label
                        >
                      </div>
                      <div class="edit-field edit-field-sm">
                        <label>Sted<input bind:value={editPerson.city} /></label
                        >
                      </div>
                      <div class="edit-field edit-field-sm">
                        <label
                          >Land<input bind:value={editPerson.country} /></label
                        >
                      </div>
                    </div>
                    <div class="edit-row">
                      <div class="edit-field">
                        <span class="edit-label">Roller</span>
                        <div class="chip-row">
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
                      </div>
                      <div class="edit-actions">
                        <button
                          class="ghost"
                          type="button"
                          on:click={() => saveEditPerson(person.id)}
                          >Lagre</button
                        >
                        <button
                          class="ghost"
                          type="button"
                          on:click={cancelEdit}>Avbryt</button
                        >
                      </div>
                    </div>
                  </div>
                </div>
              {:else}
                <div class="person-row">
                  <span class="col-name">{person.friendlyName}</span>
                  <span class="col-rsvp"
                    >{person.rsvp === "YES"
                      ? "Ja"
                      : person.rsvp === "NO"
                        ? "Nei"
                        : "–"}</span
                  >
                  <span class="col-meta">
                    <span class="col-phone">{person.phone ?? "—"}</span>
                    <span class="col-dietary">{person.dietary || "—"}</span>
                    <span class="col-seen" title={formatDate(person.lastSeen)}
                      >{timeAgo(person.lastSeen)}</span
                    >
                  </span>
                  <span class="col-img">
                    <button
                      class="ghost icon-btn"
                      type="button"
                      title="Last opp bilde"
                      on:click={() => toggleImageUpload(person.id)}>📸</button
                    >
                  </span>
                  <span class="col-actions">
                    <button
                      class="ghost"
                      type="button"
                      title="Rediger"
                      on:click={() => startEdit(person)}>✎</button
                    >
                    <button
                      class="danger"
                      type="button"
                      title="Slett"
                      on:click={() => doDeletePerson(person.id)}>✕</button
                    >
                  </span>
                </div>

                {#if activeImagePersonId === person.id}
                  <div
                    class="dropzone"
                    role="region"
                    aria-label="Bildeopplasting"
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
                    {#if uploadingImageFor === person.id}<p>
                        Laster opp bilde ...
                      </p>{/if}
                    {#if imageUploadError}<p class="error">
                        {imageUploadError}
                      </p>{/if}
                  </div>
                {/if}
              {/if}
            {/each}

            {#if group.members[0]?.comment}
              <div class="group-comment">💬 {group.members[0].comment}</div>
            {/if}
          </div>
        {/each}
      </div>
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
      <h2>Påmeldinger program</h2>
      <div class="panel-actions">
        <button class="ghost" on:click={loadProgramBookings} disabled={programBookingsLoading}>
          Last inn
        </button>
      </div>
    </div>

    {#if programBookingsLoading}
      <div class="muted" style="margin-top: 0.5rem">Laster...</div>
    {:else if programBookingsError}
      <div class="error">{programBookingsError}</div>
    {:else if programBookings.length === 0}
      <div class="muted" style="margin-top: 0.5rem">Ingen påmeldinger ennå.</div>
    {:else}
      <div class="booking-entries">
        {#each programBookings as entry}
          <div class="booking-entry">
            <div class="booking-entry-head">
              <span class="booking-entry-slug">{formatEntrySlug(entry.slug)}</span>
              <span class="booking-entry-count">
                {entry.bookedCount}{entry.bookableSlots ? `/${entry.bookableSlots}` : ""} påmeldt
              </span>
            </div>
            <table class="booking-table">
              <thead>
                <tr>
                  <th>Navn</th>
                  <th>Status</th>
                  <th>Opprinnelig svar</th>
                  <th>Endret svar</th>
                </tr>
              </thead>
              <tbody>
                {#each entry.bookings as b}
                  <tr>
                    <td>{b.personName}</td>
                    <td>
                      <span class="booking-badge" class:badge-yes={b.status === "BOOKED"} class:badge-no={b.status === "CANCELLED"}>
                        {b.status === "BOOKED" ? "Ja" : "Nei"}
                      </span>
                    </td>
                    <td title={formatDate(b.createdAt)}>{timeAgo(b.createdAt)}</td>
                    <td title={formatDate(b.lastUpdatedAt)}>{timeAgo(b.lastUpdatedAt)}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <div class="panel">
    <div class="panel-head">
      <h2>Sider (blocks)</h2>

      <div class="panel-actions">
        <select bind:value={pageSlug} on:change={loadPage}>
          <option value="praktisk">Praktisk info</option>
          <option value="program">Program</option>
          <option value="roller">Roller</option>
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

  .field label,
  .field .field-group-label {
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

  /* -------- Gjesteliste: groupperte kort -------- */

  .person-list {
    margin-top: 0.75rem;
    overflow-x: auto;
    --person-cols: 2fr 0.5fr 2fr auto auto;
  }

  .person-cols-header {
    display: grid;
    grid-template-columns: var(--person-cols);
    gap: 0 0.5rem;
    padding: 0 0.75rem 0.3rem;
    font-size: 0.75rem;
    font-weight: 600;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .person-groups {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .person-group {
    border: 1px solid #e0e8e3;
    border-radius: 12px;
    background: #fff;
    overflow: hidden;
  }

  .person-row {
    display: grid;
    grid-template-columns: var(--person-cols);
    gap: 0 0.5rem;
    align-items: center;
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
    border-bottom: 1px solid #f0f4f1;
  }

  .person-row:last-of-type {
    border-bottom: none;
  }

  .col-actions {
    display: flex;
    gap: 0.25rem;
    justify-content: flex-end;
    white-space: nowrap;
  }

  .col-img {
    display: flex;
    justify-content: center;
  }

  .col-meta {
    display: flex;
    gap: 0.5rem;
    font-size: 0.82rem;
    color: #888;
    align-items: center;
    min-width: 0;
    flex-wrap: wrap;
  }

  .col-phone::after,
  .col-dietary::after {
    content: " ·";
    color: #ccc;
  }

  @media (max-width: 680px) {
    .person-list {
      overflow-x: unset;
    }

    .person-cols-header {
      display: none;
    }

    .person-row {
      grid-template-columns: 1fr auto auto;
      grid-template-areas:
        "name rsvp actions"
        "meta meta meta";
      row-gap: 0.25rem;
      padding: 0.65rem 0.75rem;
    }

    .col-name    { grid-area: name; font-weight: 500; }
    .col-rsvp    { grid-area: rsvp; font-size: 0.82rem; color: #555; }
    .col-img     { display: none; }
    .col-actions { grid-area: actions; }
    .col-meta    { grid-area: meta; flex-wrap: nowrap; overflow: hidden; }

    .col-phone::after,
    .col-dietary::after {
      content: " ·";
    }
  }

  .group-comment {
    padding: 0.4rem 0.75rem 0.55rem;
    font-size: 0.82rem;
    color: #6e756f;
    font-style: italic;
    background: #f7fbf9;
    border-top: 1px solid #eef2ef;
  }

  .editing-row {
    background: #fbfdfc;
    padding: 0.75rem;
  }

  .edit-grid {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }

  .edit-row {
    display: flex;
    gap: 0.75rem;
    align-items: flex-end;
    flex-wrap: wrap;
  }

  .edit-field {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    flex: 1;
    min-width: 120px;
  }

  .edit-field-sm {
    flex: 0 1 100px;
    min-width: 80px;
  }

  .edit-field label,
  .edit-label {
    font-size: 0.75rem;
    font-weight: 500;
    color: #555;
  }

  .edit-field input,
  .edit-field select {
    width: 100%;
    box-sizing: border-box;
    padding: 0.35rem 0.5rem;
    border-radius: 8px;
    border: 1px solid #e0e4e0;
    font-size: 0.85rem;
  }

  .edit-actions {
    display: flex;
    gap: 0.4rem;
    align-items: flex-end;
    margin-left: auto;
  }

  .inline-checkbox {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.8rem;
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
  }

  /* -------- Påmeldinger program -------- */

  .booking-entries {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 0.75rem;
  }

  .booking-entry {
    border: 1px solid #e0e8e3;
    border-radius: 10px;
    padding: 0.65rem 0.85rem;
  }

  .booking-entry-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.45rem;
  }

  .booking-entry-slug {
    font-weight: 500;
    font-size: 0.95rem;
  }

  .booking-entry-count {
    font-size: 0.82rem;
    color: #6e756f;
  }

  .booking-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.85rem;
    margin-top: 0.1rem;
  }

  .booking-table th {
    text-align: left;
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #888;
    padding: 0.3rem 0.5rem;
    border-bottom: 1px solid #e8ece8;
  }

  .booking-table td {
    padding: 0.4rem 0.5rem;
    color: #333;
    border-bottom: 1px solid #f2f5f2;
  }

  .booking-table tr:last-child td {
    border-bottom: none;
  }

  .booking-badge {
    display: inline-block;
    padding: 0.1rem 0.55rem;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 500;
  }

  .badge-yes {
    background: #e8f4ef;
    color: #2f6f5e;
  }

  .badge-no {
    background: #fce8e8;
    color: #b94040;
  }
</style>
