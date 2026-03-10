<script lang="ts">
  import { navigate } from "../lib/router";
  import { constants } from "../lib/constants";
</script>

<main class="privacy-page">
  <div class="privacy-inner">
    <button class="back-btn" on:click={() => navigate("/")}>← Tilbake</button>

    <h1>Personvernerklæring</h1>
    <p class="updated">Sist oppdatert: mars 2026</p>

    <section>
      <h2>1. Behandlingsansvarlig</h2>
      <p>
        Personopplysningene som samles inn i forbindelse med dette bryllupet
        behandles av brudeparet (heretter «vi» eller «oss»). For spørsmål om
        personvern kan du kontakte oss via kontaktsiden.
      </p>
    </section>

    <section>
      <h2>2. Hvilke opplysninger samler vi inn?</h2>
      <p>
        I forbindelse med RSVP-skjemaet samler vi inn følgende opplysninger:
      </p>
      <ul>
        <li>Navn og kontaktinformasjon (e-post, telefonnummer, adresse)</li>
        <li>Svar på invitasjonen (kommer / kommer ikke)</li>
        <li>Kostholdsrestriksjoner og allergier</li>
        <li>Eventuelle kommentarer du oppgir</li>
        <li>Tidspunkt for innlogging og bruk av nettsiden</li>
      </ul>
    </section>

    <section>
      <h2>3. Formål og rettslig grunnlag</h2>
      <p>
        Opplysningene brukes utelukkende til å planlegge og gjennomføre
        bryllupet, herunder:
      </p>
      <ul>
        <li>Holde oversikt over hvem som kommer</li>
        <li>Tilrettelegge for allergier og kostholdsvalg</li>
        <li>Kommunisere praktisk informasjon til gjestene</li>
      </ul>
      <p>
        Det rettslige grunnlaget for behandlingen er ditt samtykke, jf.
        personvernforordningen (GDPR) art. 6 nr. 1 bokstav a. Du kan når som
        helst trekke tilbake samtykket ditt.
      </p>
    </section>

    <section>
      <h2>4. Lagring og sletting</h2>
      <p>
        Personopplysningene slettes senest seks måneder etter bryllupsdagen.
        Opplysningene lagres på sikre servere og deles ikke med tredjeparter,
        med unntak av leverandører som bistår med teknisk drift (f.eks.
        hostingleverandør), og da kun i den grad det er nødvendig.
      </p>
      <p>
        Nettsiden hostes hos {constants.hostingProvider} som er {constants.hostingDescription},
        og personopplysninger lagres i en database på deres servere hos {constants.hostingLocation}.
      </p>
    </section>

    <section>
      <h2>5. Dine rettigheter</h2>
      <p>I henhold til GDPR har du rett til å:</p>
      <ul>
        <li>Få innsyn i hvilke opplysninger vi har lagret om deg</li>
        <li>Kreve retting av uriktige opplysninger</li>
        <li>Kreve sletting av opplysningene dine («retten til å bli glemt»)</li>
        <li>Trekke tilbake samtykket ditt når som helst</li>
        <li>
          Klage til Datatilsynet (datatilsynet.no) dersom du mener vi behandler
          opplysningene dine i strid med regelverket
        </li>
      </ul>
      <p>
        For å utøve disse rettighetene, ta kontakt med oss via kontaktsiden.
      </p>
    </section>

    <section>
      <h2>6. Informasjonskapsler (cookies)</h2>
      <p>
        Nettsiden bruker en sesjonsbasert innloggingsmekanisme som lagrer en
        nødvendig informasjonskapsel i nettleseren din for å holde deg
        innlogget. Det brukes ingen sporings- eller reklamecookies.
      </p>
    </section>
  </div>
</main>

<style>
  .privacy-page {
    min-height: 100vh;
    background: #f9f7f4;
    padding: 3rem 1rem 5rem;
    display: flex;
    justify-content: center;
  }

  .privacy-inner {
    width: 100%;
    max-width: 680px;
  }

  .back-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 0.85rem;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #888;
    padding: 0;
    margin-bottom: 2rem;
  }

  .back-btn:hover {
    color: #333;
  }

  h1 {
    font-size: 1.5rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    margin: 0 0 0.25rem;
    color: #333;
  }

  .updated {
    font-size: 0.8rem;
    color: #aaa;
    letter-spacing: 0.1em;
    margin: 0 0 2.5rem;
  }

  section {
    margin-bottom: 2rem;
  }

  h2 {
    font-size: 0.9rem;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: #555;
    margin: 0 0 0.6rem;
  }

  p,
  li {
    font-size: 0.95rem;
    line-height: 1.7;
    color: #444;
  }

  ul {
    padding-left: 1.25rem;
    margin: 0.5rem 0;
  }

  li {
    margin-bottom: 0.25rem;
  }
</style>
