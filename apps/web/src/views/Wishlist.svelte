<script lang="ts">
  import Template from "../lib/Template.svelte";
  import ScrollNudge from "../components/ScrollNudge.svelte";
  import { constants } from "../lib/constants";

  export let title = "GAVEØNSKER";
  export let lead =
    "Vårt aller største ønske er virkelig kun at dere kommer og feirer dagen med oss. Men, om dere likevel ønsker å gi en gave har vi satt opp noen alternativer nedenfor:";
</script>

<Template style="light">
  <main class="page">
    <section class="intro">
      <div class="intro-inner">
        <h1 class="page-title">{title}</h1>
        {#if lead}<p class="lead">{lead}</p>{/if}

        <ScrollNudge
          onClick={() =>
            document
              .querySelector(".content")
              ?.scrollIntoView({ behavior: "smooth" })}
        />
      </div>
    </section>

    <section class="content">
      <div class="wrap">
        <div class="wishes">
          <div class="wish-card">
            <svg
              class="wish-icon"
              viewBox="0 0 80 80"
              fill="none"
              stroke="currentColor"
              stroke-width="1.75"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <!-- lamp cord -->
              <line x1="40" y1="8" x2="40" y2="22" />

              <!-- lamp shade -->
              <path d="M31 32c1-6 5-10 9-10s8 4 9 10" />
              <line x1="31" y1="32" x2="49" y2="32" />

              <!-- table top -->
              <rect x="20" y="44" width="40" height="3" rx="1.5" />

              <!-- table legs -->
              <line x1="26" y1="47" x2="23" y2="60" />
              <line x1="54" y1="47" x2="57" y2="60" />
            </svg>
            <p class="wish-label">Bidrag til vår nye<br />spisestue</p>
          </div>

          <div class="wish-card">
            <svg
              class="wish-icon"
              viewBox="0 0 80 80"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <!-- suitcase body -->
              <rect x="17" y="25" width="46" height="33" rx="5.5" />

              <!-- handle -->
              <path d="M33 25v-5c0-1.7 1.3-3 3-3h8c1.7 0 3 1.3 3 3v5" />
              <rect x="33" y="17" width="14" height="7" rx="2" />

              <!-- side seams -->
              <line x1="27" y1="25" x2="27" y2="58" />
              <line x1="53" y1="25" x2="53" y2="58" />

              <!-- heart -->
              <path
                d="M58 19.5c0-1.9 1.5-3.4 3.4-3.4c1.3 0 2.5.7 3.1 1.8c0.7-1.1 1.8-1.8 3.1-1.8c1.9 0 3.4 1.5 3.4 3.4c0 3.1-3.1 5.3-6.5 8.1c-3.4-2.8-6.5-5-6.5-8.1z"
              />
            </svg>
            <p class="wish-label">Bidrag til<br />bryllupsreisen vår</p>
          </div>
        </div>

        <div class="divider" />

        <p class="payment-text">
          Ønsker du å gi et bidrag kan du overføre til kontonummer:
        </p>
        <p class="account-number">{constants.accountNumber}</p>
        <p class="payment-note">
          Merk gjerne betalingen med hva bidraget er<br />ment til
          (spisestue/bryllupsreise)
        </p>
        <p class="payment-note">
          Om dere evt. ønsker å gi noe helt annet så blir vi selvfølgelig glad
          for alt.
        </p>
      </div>
    </section>
  </main>
</Template>

<style>
  .page {
    min-height: 100vh;
    background: #f2f1ee;
    color: #2a2a2a;
  }
  .intro {
    min-height: calc(100vh - 72px);
    display: grid;
    place-items: center;
    padding: 5.5rem 1rem 2.5rem;
    text-align: center;
  }
  .intro-inner {
    width: 100%;
    max-width: 760px;
  }
  .page-title {
    margin: 0;
    font-size: 2.2rem;
    letter-spacing: 0.28em;
    font-weight: 500;
  }
  .lead {
    margin: 1.1rem auto 0;
    max-width: 46ch;
    font-size: 1.05rem;
    line-height: 1.45;
    color: rgba(42, 42, 42, 0.7);
  }

  /* ── Content section ── */
  .content {
    padding: 2rem 0 6rem;
    text-align: center;
  }
  .wrap {
    max-width: 760px;
    margin: 0 auto;
    padding: 0 1rem;
  }

  /* ── Wish cards ── */
  .wishes {
    display: flex;
    justify-content: center;
    gap: 4rem;
    margin-bottom: 3rem;
  }
  .wish-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
  }
  .wish-icon {
    width: 80px;
    height: 80px;
    color: #2a2a2a;
    opacity: 0.7;
  }
  .wish-label {
    margin: 0;
    font-size: 0.92rem;
    line-height: 1.45;
    color: rgba(42, 42, 42, 0.7);
  }

  /* ── Divider & payment ── */
  .divider {
    height: 1px;
    background: linear-gradient(90deg, transparent, #b8b0d8, transparent);
    margin-bottom: 2.5rem;
  }
  .payment-text {
    margin: 0;
    font-size: 1rem;
    color: rgba(42, 42, 42, 0.7);
  }
  .account-number {
    margin: 1rem 0 0;
    font-size: 1.8rem;
    font-weight: 500;
    letter-spacing: 0.05em;
  }
  .payment-note {
    margin: 1.5rem 0 0;
    font-size: 0.92rem;
    line-height: 1.5;
    color: rgba(42, 42, 42, 0.55);
  }

  @media (max-width: 820px) {
    .intro {
      min-height: calc(100vh - 64px);
      padding-top: 5rem;
    }
    .page-title {
      font-size: 1.9rem;
    }
    .lead {
      font-size: 1rem;
    }
    .wishes {
      gap: 2.5rem;
    }
    .account-number {
      font-size: 1.5rem;
    }
  }

  @media (max-width: 480px) {
    .wishes {
      flex-direction: column;
      gap: 2rem;
      align-items: center;
    }
  }
</style>
