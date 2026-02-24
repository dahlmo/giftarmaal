<script lang="ts">
  import type { Person } from "../../src/lib/api";
  import Template from "../lib/Template.svelte";
  import { onMount } from "svelte";

  let contacts: Person[] = [];
  let loading = true;
  let error: string | null = null;

  const fallbackContact: Person = {
    id: "123-123-123",
    friendlyName: "",
    fullName: "",
    email: "",
    phone: "99999999",
    invitationCode: "",
    addressLine1: "",
    zipcode: "",
    city: "string",
    country: "string",
    title: "string",
    roles: ["PERSON_OF_HONOR"],
    rsvp: "YES",
    saveTheDateSent: true,
    createdAt: "string",
    updatedAt: "string",
    imagePath: "",
    thumbPath: "",
  };

  onMount(async () => {
    loading = true;
    error = null;

    try {
      const res = await fetch("/api/persons");
      if (!res.ok) throw new Error("Kunne ikke hente kontaktliste.");
      const data = await res.json();
      contacts = data.persons ?? [];
      console.debug({ contacts });
    } catch (e) {
      error = e instanceof Error ? e.message : "Ukjent feil";
      contacts = [];
    } finally {
      loading = false;
    }
  });

  const phoneSvg = `<svg viewBox="0 0 24 24" fill="none"><path d="M7.2 3.8c.8-1 2.3-1 3.1 0l1.3 1.6c.6.8.6 1.9-.1 2.6l-1 1c1 1.9 2.5 3.4 4.4 4.4l1-1c.7-.7 1.8-.7 2.6-.1l1.6 1.3c1 .8 1 2.3 0 3.1l-.9.8c-.9.9-2.2 1.2-3.4.8-6.2-2.1-11-6.9-13.1-13.1-.4-1.2-.1-2.5.8-3.4l.8-.9z" fill="currentColor"/></svg>`;
  const mailSvg = `<svg viewBox="0 0 24 24" fill="none"><path d="M4.5 7.5A2.5 2.5 0 0 1 7 5h10a2.5 2.5 0 0 1 2.5 2.5v9A2.5 2.5 0 0 1 17 19H7a2.5 2.5 0 0 1-2.5-2.5v-9z" stroke="currentColor" stroke-width="1.6"/><path d="M6.2 8.2 12 12.4l5.8-4.2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  $: coupleList = contacts.filter((c) => c.roles.includes("SPOUSE_TO_BE"));
  $: forlovereList = contacts.filter((c) =>
    c.roles.includes("PERSON_OF_HONOR"),
  );
  $: toastmasterContact =
    contacts.find((c) => c.roles.includes("TOASTMASTER")) ?? null;

  // Vis fallback i UI hvis API returnerer tomt for forlovere
  $: forlovereUi = forlovereList.length ? forlovereList : [fallbackContact];
</script>

<svelte:head>
  <title>Kontakt</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

<Template>
  <main class="page">
    <div class="wrap">
      <section class="intro">
        <h1 class="page-title">KONTAKT</h1>
      </section>

      {#if loading}
        <div>Laster kontaktinformasjon ...</div>
      {:else if error}
        <div class="error">{error}</div>
      {:else}
        <!-- PAR -->
        <section class="top-grid" aria-label="Kontaktinformasjon">
          {#each coupleList as p (p.id)}
            <div class="contact-card">
              <h2 class="name">{p.friendlyName}</h2>
              <div class="lines">
                {#if p.phone}
                  <div class="line">
                    <span class="icon" aria-hidden="true">{@html phoneSvg}</span
                    >
                    <a class="link" href={"tel:" + p.phone.replace(/\s/g, "")}
                      >{p.phone}</a
                    >
                  </div>
                {/if}

                {#if p.email}
                  <div class="line">
                    <span class="icon" aria-hidden="true">{@html mailSvg}</span>
                    <a class="link" href={"mailto:" + p.email}>{p.email}</a>
                  </div>
                {/if}
              </div>
            </div>
          {/each}
        </section>

        <!-- FORLOVERE -->
        <section class="block">
          <h2 class="section-title"><span>FORLOVERE</span></h2>
          <p class="sub">
            For spørsmål rundt utdrikningslag, overraskelser og praktiske
            detaljer
          </p>

          <div class="people-grid">
            {#each forlovereUi as p (p.id)}
              <div class="person">
                {#if p.imagePath}
                  <img
                    class="avatar"
                    src={p.imagePath}
                    alt={p.friendlyName}
                    loading="lazy"
                  />
                {/if}

                <div class="person-name">{p.friendlyName}</div>

                <div class="mini-lines">
                  {#if p.phone}
                    <div class="mini-line">
                      <span class="icon sm" aria-hidden="true"
                        >{@html phoneSvg}</span
                      >
                      <a class="link" href={"tel:" + p.phone.replace(/\s/g, "")}
                        >{p.phone}</a
                      >
                    </div>
                  {/if}

                  {#if p.email}
                    <div class="mini-line">
                      <span class="icon sm" aria-hidden="true"
                        >{@html mailSvg}</span
                      >
                      <a class="link" href={"mailto:" + p.email}>{p.email}</a>
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </section>

        <!-- TOASTMASTER -->
        {#if toastmasterContact}
          <section class="block toast-block">
            <h2 class="section-title"><span>TOASTMASTER</span></h2>
            <p class="sub">
              Ønsker du å holde tale eller bidra i programmet?<br />
              Ta kontakt med toastmaster.
            </p>

            <div class="toast">
              {#if toastmasterContact.imagePath}
                <img
                  class="avatar lg"
                  src={toastmasterContact.imagePath}
                  alt={toastmasterContact.friendlyName}
                  loading="lazy"
                />
              {/if}

              <div class="person-name">
                {toastmasterContact.friendlyName}
              </div>

              <div class="mini-lines">
                {#if toastmasterContact.phone}
                  <div class="mini-line">
                    <span class="icon sm" aria-hidden="true"
                      >{@html phoneSvg}</span
                    >
                    <a
                      class="link"
                      href={"tel:" +
                        toastmasterContact.phone.replace(/\s/g, "")}
                    >
                      {toastmasterContact.phone}
                    </a>
                  </div>
                {/if}

                {#if toastmasterContact.email}
                  <div class="mini-line">
                    <span class="icon sm" aria-hidden="true"
                      >{@html mailSvg}</span
                    >
                    <a class="link" href={"mailto:" + toastmasterContact.email}>
                      {toastmasterContact.email}
                    </a>
                  </div>
                {/if}
              </div>
            </div>
          </section>
        {/if}
      {/if}
    </div>
  </main>
</Template>

<style>
  :root {
    --ink: #2a2a2a;
    --muted: #6f756f;
    --line: rgba(42, 42, 42, 0.14);
    --bg: #f2f1ee;
    --icon: rgba(216, 204, 191, 0.95);
  }

  .page {
    min-height: 100vh;
    background: var(--bg);
    color: var(--ink);
    padding: 6.6rem 1rem 7rem;
  }

  .wrap {
    max-width: 1060px;
    margin: 0 auto;
  }

  .intro {
    text-align: center;
    padding-top: 0.2rem;
    padding-bottom: 3.4rem;
  }

  .page-title {
    margin: 0;
    font-size: 1.55rem;
    font-weight: 500;
    letter-spacing: 0.22em;
  }

  .top-grid {
    max-width: 820px;
    margin: 0 auto 6.2rem;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 7.5rem;
    justify-items: center;
  }

  .contact-card {
    width: 100%;
    max-width: 320px;
    text-align: left;
  }

  .name {
    margin: 0 0 0.95rem;
    font-size: 1.05rem;
    font-weight: 500;
  }

  .lines {
    display: grid;
    gap: 0.85rem;
  }

  .line {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .block {
    margin-top: 6.2rem;
    text-align: center;
  }

  .section-title {
    margin: 0 auto 0.65rem;
    max-width: 920px;
    display: flex;
    align-items: center;
    gap: 1.4rem;
    justify-content: center;
    font-weight: 600;
    letter-spacing: 0.36em;
    font-size: 1.2rem;
  }

  .section-title::before,
  .section-title::after {
    content: "";
    height: 1px;
    background: rgba(42, 42, 42, 0.1);
    flex: 1;
  }

  .section-title span {
    white-space: nowrap;
    transform: translateY(1px);
  }

  .sub {
    margin: 0 auto;
    max-width: 64ch;
    color: var(--muted);
    font-size: 0.92rem;
    line-height: 1.55;
  }

  .people-grid {
    margin: 3.15rem auto 0;
    max-width: 980px;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 5.4rem;
    justify-items: center;
  }

  .person {
    width: 100%;
    max-width: 280px;
    text-align: center;
  }

  .avatar {
    width: 220px;
    height: 220px;
    border-radius: 999px;
    object-fit: cover;
    display: block;
    margin: 0 auto 1.45rem;
    background: rgba(0, 0, 0, 0.03);
  }

  .avatar.lg {
    width: 240px;
    height: 240px;
  }

  .person-name {
    margin: 0 0 1.15rem;
    text-transform: uppercase;
    letter-spacing: 0.16em;
    font-size: 0.72rem;
    font-weight: 600;
  }

  .mini-lines {
    display: grid;
    gap: 0.75rem;
    justify-items: center;
  }

  .mini-line {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.9rem;
  }

  .icon {
    width: 18px;
    height: 18px;
    color: var(--icon);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    opacity: 0.9;
  }

  .icon.sm {
    width: 17px;
    height: 17px;
  }

  .link {
    color: rgba(42, 42, 42, 0.9);
    text-decoration: none;
    font-size: 0.95rem;
  }

  .link:hover {
    text-decoration: underline;
  }

  .toast-block {
    margin-top: 6.5rem;
    padding-top: 0.25rem;
  }

  .toast {
    margin-top: 3.05rem;
    display: grid;
    justify-items: center;
  }

  @media (max-width: 980px) {
    .top-grid {
      gap: 3.5rem;
    }
    .people-grid {
      gap: 3rem;
    }
  }

  @media (max-width: 860px) {
    .top-grid {
      grid-template-columns: 1fr;
      gap: 2.6rem;
      justify-items: start;
      max-width: 520px;
    }

    .people-grid {
      grid-template-columns: 1fr;
      gap: 3.2rem;
    }

    .person {
      max-width: 340px;
    }
  }

  @media (max-width: 560px) {
    .page {
      padding-top: 5.75rem;
    }
    .avatar {
      width: 190px;
      height: 190px;
    }
    .avatar.lg {
      width: 210px;
      height: 210px;
    }
  }
</style>
