<script lang="ts">
  import { currentPath, navigate } from "./router";
  import { authed as authedStore } from "./auth";
  import { onMount } from "svelte";
  export let style: "light" | "dark" = "dark";
  $: path = $currentPath;

  let authed = false;
  let invite = "";
  let checking = true;
  let error: string | null = null;

  $: authedStore.set(authed);

  function getCookie(name: string): string | null {
    const v = document.cookie
      .split("; ")
      .find((row) => row.startsWith(name + "="));
    return v ? decodeURIComponent(v.split("=")[1]) : null;
  }

  async function checkAuth() {
    checking = true;
    try {
      const code = getCookie("invitationCode");
      if (!code) {
        authed = false;
        return;
      }
      const res = await fetch("/api/auth/me", { credentials: "include" });
      authed = res.ok;
    } catch (e) {
      authed = false;
    } finally {
      checking = false;
    }
  }

  async function login(e: SubmitEvent) {
    e.preventDefault();
    error = null;
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationCode: invite.trim() }),
        credentials: "include",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || "Ugyldig kode");
      }
      authed = true;
      document.getElementById("auth-modal")?.close?.();
    } catch (e) {
      error = e instanceof Error ? e.message : "Noe gikk galt";
      authed = false;
    }
  }

  function logout() {
    document.cookie = "invitationCode=; Max-Age=0; path=/";
    authed = false;
  }

  onMount(checkAuth);
</script>

{#if !checking && !authed}
  <dialog id="auth-modal" class="modal" open>
    <form method="dialog" on:submit={login} class="card">
      <h2>Velkommen</h2>
      <p>Skriv inn invitasjonskoden din for å fortsette.</p>
      <input
        type="text"
        placeholder="Invitasjonskode"
        bind:value={invite}
        autocomplete="one-time-code"
        required
      />
      {#if error}<div class="error">{error}</div>{/if}
      <button type="submit">Fortsett</button>
    </form>
  </dialog>
{/if}

<header class="topbar {style}">
  <nav class="menu {style}" aria-label="Hovedmeny">
    <a
      href="/"
      aria-label="Forside"
      class:selected={path === "/"}
      on:click|preventDefault={() => navigate("/")}>FORSIDE</a
    >
    <a
      href="/praktisk"
      aria-label="Praktisk informasjon"
      class:selected={path === "/praktisk"}
      on:click|preventDefault={() => navigate("/praktisk")}
      >PRAKTISK INFORMASJON</a
    >
    <a
      href="/program"
      aria-label="Program"
      class:selected={path === "/program"}
      on:click|preventDefault={() => navigate("/program")}>PROGRAM</a
    >
    <a
      href="/kontakt"
      aria-label="Kontakt"
      class:selected={path === "/kontakt"}
      on:click|preventDefault={() => navigate("/kontakt")}>KONTAKT</a
    >
    <a href="#" aria-label="Ønskeliste">ØNSKELISTE</a>
    <span class="spacer" />
  </nav>
</header>

<div class:unauthed={!authed} class:checking class="page-wrap">
  <slot />
</div>

<footer class="footer">
  <small>&copy; {new Date().getFullYear()} Giftarmaal</small>
  {#if authed}
    <button class="textbtn" on:click={logout}>Logg ut</button>
  {/if}
</footer>

<style>
  :root {
    --line: #e7ebe7;
    --ink: #000;
  }
  #auth-modal {
    z-index: 1000;
    margin-top: 100px;
  }
  .topbar {
    position: fixed;
    inset: 0 0 auto 0;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;
    z-index: 10;
  }
  header.dark {
    background: rgba(242, 241, 238, 0.7);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .menu {
    display: flex;
    gap: 18px;
    margin-left: auto;
    align-items: center;
  }
  .menu a {
    color: var(--ink);
    text-decoration: none;
    font-weight: 500;
    padding: 6px 8px;
    border-radius: 6px;
  }

  .menu.dark a {
    color: #787778;
  }
  .menu.light a {
    color: #b4b4b2;
  }
  .menu a.selected {
    font-weight: bold;
  }
  .spacer {
    flex: 1;
  }
  .textbtn {
    background: none;
    border: none;
    color: #555;
    cursor: pointer;
  }

  .page-wrap {
    transition:
      filter 160ms ease,
      opacity 160ms ease;
  }
  .page-wrap.unauthed {
    filter: blur(3px);
    opacity: 0.3;
    pointer-events: none;
    user-select: none;
  }
  .page-wrap.checking {
    filter: none;
    opacity: 1;
  }

  .modal {
    border: none;
    padding: 0;
    background: transparent;
  }
  .card {
    background: white;
    padding: 1.2rem;
    border-radius: 12px;
    min-width: 320px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  }
  .card h2 {
    margin: 0 0 0.35rem;
  }
  .card p {
    margin: 0 0 0.8rem;
    color: #666;
  }
  .card input {
    width: 100%;
    padding: 0.65rem 0.75rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
  }
  .card button {
    margin-top: 0.9rem;
    width: 100%;
    padding: 0.6rem 0.8rem;
    border-radius: 8px;
    background: #2a2a2a;
    color: white;
    border: none;
    cursor: pointer;
  }
  .error {
    color: #c33;
    margin-top: 0.5rem;
  }

  .footer {
    border-top: 1px solid var(--line);
    text-align: center;
    padding: 1.5rem 1rem;
    color: #6e756f;
  }
</style>
