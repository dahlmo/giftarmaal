<script lang="ts">
  import { authed as authedStore } from "./auth";
  import { onMount } from "svelte";
  import NavMenu from "./NavMenu.svelte";
  export let style: "light" | "dark" = "dark";

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

<NavMenu {style} />

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
  .textbtn {
    background: none;
    border: none;
    color: #555;
    cursor: pointer;
  }

  .page-wrap {
    overflow-x: hidden;
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
