<script lang="ts">
  import { authed as authedStore } from "./auth";
  import type { MemberDto } from "@giftarmaal/dto";

  let loading = false;
  let submitState: "idle" | "submitting" | "success" | "error" = "idle";
  let alreadySubmittedRsvp = false;

  let members: MemberDto[] = [];

  let attendings: Record<string, "yes" | "no"> = {};
  let diets: Record<string, string> = {};
  let comment = "";

  // PersonRole -> norsk label
  const ROLE_LABELS: Record<MemberDto["roles"][number], string> = {
    GUEST: "Gjest",
    TOASTMASTER: "Toastmaster",
    PERSON_OF_HONOR: "Forlover",
    PARENT: "Forelder",
    VENDOR: "Leverandør",
    SPOUSE_TO_BE: "Brud/Brudgom",
  };

  function formatRoles(roles: MemberDto["roles"]) {
    const formattedRoles = roles
      .map((r) => ROLE_LABELS[r] ?? r)
      .filter(Boolean)
      .filter((r) => r !== "Gjest")
      .join(", ");
    if (formattedRoles) {
      return ` –  ${formattedRoles}`;
    }

    return "";
  }

  async function loadMembers() {
    loading = true;
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        members = data.members as MemberDto[];
        for (const m of members) {
          if (m.rsvp !== "UNKNOWN") alreadySubmittedRsvp = true;
          attendings[m.id] =
            m.rsvp === "YES" ? "yes" : m.rsvp === "NO" ? "no" : "yes";
          diets[m.id] = m.dietary ?? "";
        }
        comment = members[0]?.comment ?? "";
      }
    } finally {
      loading = false;
    }
  }

  $: if ($authedStore) {
    loadMembers();
  } else {
    members = [];
    attendings = {};
    diets = {};
    comment = "";
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    submitState = "submitting";
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          members: members.map((m) => ({
            id: m.id,
            attending: attendings[m.id],
            dietary: diets[m.id],
          })),
          comment,
        }),
      });
      submitState = res.ok ? "success" : "error";
    } catch {
      submitState = "error";
    }
  }
</script>

<section class="rsvp-section">
  <div class="rsvp-inner">
    <h2 class="rsvp-title">Svar på invitasjonen</h2>
    <p class="rsvp-subtitle">
      Vi ber om svar fra {members.length === 1 ? "deg" : "dere"} innen 1. mai. Det
      er mulig å endre svar helt frem til fristen.
    </p>

    {#if loading}
      <p class="rsvp-status">Laster…</p>
    {:else if members.length}
      <form class="rsvp-form" on:submit={handleSubmit}>
        {#each members as member, i}
          {#if i > 0}
            <div class="rsvp-divider" />
          {/if}

          <div class="rsvp-member-name">
            {member.friendlyName}
            {#if member.roles?.length}
              {formatRoles(member.roles)}
            {/if}
          </div>

          <div class="rsvp-row">
            <label class="rsvp-radio">
              <input
                type="radio"
                name={"attending-" + member.id}
                value="yes"
                bind:group={attendings[member.id]}
              />
              <span>Jeg kommer!</span>
            </label>
            <label class="rsvp-radio">
              <input
                type="radio"
                name={"attending-" + member.id}
                value="no"
                bind:group={attendings[member.id]}
              />
              <span>Jeg kan ikke komme</span>
            </label>
          </div>

          <input
            class="rsvp-input"
            type="text"
            placeholder="Evt. allergier"
            bind:value={diets[member.id]}
          />
        {/each}

        <label class="rsvp-input-label">
          <span class="label-text"> Evt. kommentarer </span>

          <input
            class="rsvp-input"
            type="text"
            placeholder="EVT. KOMMENTAR FRA OSS BEGGE"
            bind:value={comment}
          />
        </label>

        {#if submitState === "success"}
          <p class="rsvp-feedback rsvp-feedback--success">
            Svaret er registrert!
          </p>
        {:else}
          <button
            type="submit"
            class="rsvp-submit"
            disabled={submitState === "submitting"}
          >
            {submitState === "submitting"
              ? "Sender…"
              : alreadySubmittedRsvp
                ? "Endre svar"
                : "Svar"}
          </button>
          {#if submitState === "error"}
            <p class="rsvp-feedback rsvp-feedback--error">
              Noe gikk galt. Prøv igjen.
            </p>
          {/if}
        {/if}
      </form>
    {/if}
  </div>
</section>

<style>
  .rsvp-section {
    width: 100%;
    padding: 4rem 1rem 4.5rem;
    background: radial-gradient(
        circle at top left,
        rgba(255, 255, 255, 0.05),
        transparent 55%
      ),
      radial-gradient(
        circle at bottom right,
        rgba(0, 0, 0, 0.2),
        transparent 55%
      ),
      #54565b;
    color: #f5f5f5;
    display: flex;
    justify-content: center;
  }

  .rsvp-inner {
    width: 100%;
    max-width: 540px;
    text-align: center;
  }

  .rsvp-title {
    letter-spacing: 0.25em;
    font-size: 1.2rem;
    text-transform: uppercase;
    margin: 0 0 0.4rem;
  }

  .rsvp-subtitle {
    margin: 1.5rem 0 1.5rem;
    font-size: 0.9rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.8);
  }

  .rsvp-status {
    font-size: 0.9rem;
    letter-spacing: 0.1em;
    color: rgba(255, 255, 255, 0.7);
    text-transform: uppercase;
  }

  .rsvp-form {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .rsvp-divider {
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    margin: 0.25rem 0;
  }

  .rsvp-member-name {
    width: 100%;
    padding: 0.8rem 1rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.35);
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.9rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    text-align: center;
  }

  .rsvp-input {
    width: 100%;
    padding: 0.8rem 1rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.7);
    background: transparent;
    color: #fff;
    font-size: 0.9rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    outline: none;
  }

  .rsvp-input-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    margin-top: 0.75rem;
  }

  .rsvp-input::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }

  .rsvp-input:focus {
    border-color: #ffffff;
    box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.4);
  }

  .rsvp-row {
    display: flex;
    gap: 1.75rem;
    justify-content: center;
    margin: 0.1rem 0 0.15rem;
  }

  .rsvp-radio {
    display: inline-flex;
    align-items: center;
    gap: 0.6rem;
    font-size: 0.9rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    cursor: pointer;
  }

  .rsvp-radio input {
    appearance: none;
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.8);
    background: transparent;
    position: relative;
    cursor: pointer;
    flex-shrink: 0;
  }

  .rsvp-radio input:checked::after {
    content: "";
    position: absolute;
    inset: 4px;
    border-radius: 999px;
    background: #ffffff;
  }

  .rsvp-submit {
    margin-top: 0.75rem;
    align-self: center;
    padding: 0.7rem 3.5rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.9);
    background: transparent;
    color: #ffffff;
    font-size: 0.95rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    cursor: pointer;
  }

  .rsvp-submit:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .rsvp-submit:disabled {
    opacity: 0.5;
    cursor: default;
  }

  .rsvp-feedback {
    margin: 0.25rem 0 0;
    font-size: 0.85rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  .rsvp-feedback--success {
    color: rgba(180, 255, 180, 0.9);
  }

  .rsvp-feedback--error {
    color: rgba(255, 160, 160, 0.9);
  }

  @media (max-width: 600px) {
    .rsvp-row {
      flex-direction: column;
      align-items: flex-start;
      gap: 0.6rem;
    }
  }
</style>
