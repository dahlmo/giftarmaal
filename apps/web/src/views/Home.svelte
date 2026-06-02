<script lang="ts">
  import Template from "../lib/Template.svelte";
  import RsvpSection from "../lib/RsvpSection.svelte";
  import { constants } from "../lib/constants";
  import { onMount } from "svelte";
  import { ssePostCreated } from "../lib/sse";
  import { authed } from "../lib/auth";

  const RSVP_DEADLINE = "2026-05-01";
  const rsvpOpen_allowed = new Date() <= new Date(RSVP_DEADLINE);
  let rsvpOpen = false;

  type TimelineItem = { year: string; title: string; text: string };
  let timelineItems: TimelineItem[] = [];

  type PostData = {
    id: number;
    text: string;
    authorName: string;
    authorThumbPath: string | null;
    createdAt: string;
    viewCount: number;
    reactionCounts: Record<string, number>;
    myReactions: string[];
    seen: boolean;
    viewers: string[];
  };

  const EMOJIS = ["❤️", "👍", "👎", "🎉"];

  let posts: PostData[] = [];
  let postsLoading = true;

  function timeAgo(dateStr: string): string {
    const diffSec = Math.floor(
      (Date.now() - new Date(dateStr).getTime()) / 1000,
    );
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

  function initials(name: string): string {
    return name
      .split(" ")
      .map((w) => w[0] ?? "")
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  async function loadPosts() {
    try {
      const res = await fetch("/api/posts?limit=50", { cache: "no-store" });
      if (res.ok) posts = (await res.json()).posts ?? [];
    } catch {
      // silently fail
    } finally {
      postsLoading = false;
    }
  }

  async function markViewed(postId: number) {
    posts = posts.map((p) => (p.id === postId ? { ...p, seen: true } : p));
    fetch(`/api/posts/${postId}/view`, { method: "POST" }).catch(() => {});
  }

  async function react(postId: number, emoji: string) {
    const post = posts.find((p) => p.id === postId);
    if (!post) return;
    const already = post.myReactions.includes(emoji);

    posts = posts.map((p) => {
      if (p.id !== postId) return p;
      const myReactions = already
        ? p.myReactions.filter((e) => e !== emoji)
        : [...p.myReactions, emoji];
      const reactionCounts = { ...p.reactionCounts };
      if (already) {
        const next = (reactionCounts[emoji] ?? 1) - 1;
        if (next <= 0) delete reactionCounts[emoji];
        else reactionCounts[emoji] = next;
      } else {
        reactionCounts[emoji] = (reactionCounts[emoji] ?? 0) + 1;
      }
      return { ...p, myReactions, reactionCounts };
    });

    const res = await fetch(`/api/posts/${postId}/react`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    if (!res.ok) await loadPosts();
  }

  let expandedPosts = new Set<number>();

  const MAX_PREVIEW_CHARS = 260;

  function stripHtml(html: string): string {
    return html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isTruncatable(html: string): boolean {
    return stripHtml(html).length > MAX_PREVIEW_CHARS;
  }

  function previewText(html: string): string {
    const plain = stripHtml(html);
    return plain.slice(0, MAX_PREVIEW_CHARS).replace(/\s+\S*$/, "");
  }

  function expand(postId: number) {
    expandedPosts = new Set([...expandedPosts, postId]);
    markViewed(postId);
  }

  let tooltipPostId: number | null = null;
  let tooltipX = 0;
  let tooltipY = 0;

  function showTooltip(postId: number, target: EventTarget | null) {
    if (!target) return;
    const rect = (target as HTMLElement).getBoundingClientRect();
    tooltipPostId = postId;
    tooltipX = rect.left + rect.width / 2;
    tooltipY = rect.top;
  }

  function hideTooltip() {
    tooltipPostId = null;
  }

  function viewOnce(node: HTMLElement, postId: number) {
    const post = posts.find((p) => p.id === postId);
    if (post && isTruncatable(post.text)) return { destroy() {} };
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          observer.disconnect();
          markViewed(postId);
        }
      },
      { threshold: 0.4 },
    );
    observer.observe(node);
    return {
      destroy() {
        observer.disconnect();
      },
    };
  }

  ssePostCreated.subscribe((event) => {
    if (event) loadPosts();
  });

  // Reload posts when the user logs in (Home mounts before auth completes)
  let prevAuthed = false;
  authed.subscribe((value) => {
    if (value && !prevAuthed) loadPosts();
    prevAuthed = value;
  });

  onMount(async () => {
    await loadPosts();
    try {
      const res = await fetch("/api/content/timeline", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        timelineItems = (json?.data?.items ??
          json?.items ??
          []) as TimelineItem[];
      }
    } catch {
      // silently fail
    }
  });
</script>

<svelte:head>
  <title>Giftarmaal</title>
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</svelte:head>

{#if tooltipPostId !== null}
  {@const viewers = posts.find((p) => p.id === tooltipPostId)?.viewers ?? []}
  <div
    class="viewer-tooltip"
    style="left: {tooltipX}px; top: {tooltipY}px;"
    role="tooltip"
  >
    {#if viewers.length > 0}
      {#each viewers as name}
        <span class="viewer-name">{name}</span>
      {/each}
    {:else}
      <span class="viewer-name">—</span>
    {/if}
  </div>
{/if}

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->
{#if rsvpOpen_allowed}
  <div
    class="rsvp-backdrop"
    class:open={rsvpOpen}
    on:click={() => (rsvpOpen = false)}
  />
  <div
    class="rsvp-drawer"
    class:open={rsvpOpen}
    role="dialog"
    aria-modal="true"
  >
    <div class="rsvp-drawer-top">
      <div class="rsvp-handle" />
      <button
        class="rsvp-close"
        on:click={() => (rsvpOpen = false)}
        aria-label="Lukk">✕</button
      >
    </div>
    <RsvpSection />
  </div>
{/if}

<Template style="dark">
  <section class="cover">
    <div class="cover-inner">
      <img class="logo" src="/img/logo_with_date.png" alt="E&M 4. juli 2026" />
      {#if rsvpOpen_allowed}
        <button class="rsvp-cta" on:click={() => (rsvpOpen = true)}>
          Svar på invitasjon
        </button>
      {/if}
    </div>
    <a
      class="photo-credit"
      href="https://www.instagram.com/maniagwarek"
      target="_blank"
      rel="noopener noreferrer"
    >
      Foto: @maniagwarek
    </a>
  </section>

  <!-- Floating feed — stack of individual notification cards -->
  <div class="feed-anchor">
    <div class="feed-stack">
      <h2 class="feed-heading">Oppdateringer</h2>

      {#if postsLoading}
        <p class="feed-empty">Laster...</p>
      {:else if posts.length === 0}
        <p class="feed-empty">Ingen oppdateringer ennå.</p>
      {:else}
        <ul class="post-list">
          {#each posts as post, i (post.id)}
            <li
              class="post-item"
              class:unread={!post.seen}
              style="animation-delay: {i * 60}ms"
              use:viewOnce={post.id}
            >
              <header class="post-header">
                {#if post.authorThumbPath}
                  <img
                    class="post-avatar post-avatar-img"
                    src={post.authorThumbPath}
                    alt={post.authorName}
                  />
                {:else}
                  <div class="post-avatar" aria-hidden="true">
                    {initials(post.authorName)}
                  </div>
                {/if}
                <div class="post-byline">
                  <span class="post-author">{post.authorName}</span>
                  <span class="post-time">{timeAgo(post.createdAt)}</span>
                </div>
                {#if !post.seen}
                  <span class="unread-dot" aria-label="Ny oppdatering"></span>
                {/if}
              </header>

              <div class="post-body">
                {#if isTruncatable(post.text) && !expandedPosts.has(post.id)}
                  {previewText(post.text)}…
                  <button class="expand-btn" on:click={() => expand(post.id)}
                    >Les mer</button
                  >
                {:else}
                  {@html post.text}
                {/if}
              </div>

              <footer class="post-footer">
                <div class="reaction-bar">
                  {#each EMOJIS as emoji}
                    {@const count = post.reactionCounts[emoji] ?? 0}
                    {@const active = post.myReactions.includes(emoji)}
                    <button
                      class="reaction-btn"
                      class:active
                      on:click={() => react(post.id, emoji)}
                      aria-pressed={active}
                    >
                      {emoji}{#if count > 0}<span class="reaction-count"
                          >{count}</span
                        >{/if}
                    </button>
                  {/each}
                </div>
                {#if post.viewCount > 0}
                  <button
                    class="view-count"
                    on:mouseenter={(e) => showTooltip(post.id, e.currentTarget)}
                    on:mouseleave={hideTooltip}>sett av {post.viewCount}</button
                  >
                {/if}
              </footer>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>

  <main class="page1">
    <h2 class="home-title">Velkommen til bryllup!</h2>
    <section class="intro">
      <p class="lead">{constants.welcomeMessage}</p>
    </section>

    {#if timelineItems.length > 0}
      <section class="timeline">
        <h2 class="home-title">Vår historie</h2>
        <ol class="tl">
          {#each timelineItems as item, i (i)}
            <li class="tl-item">
              <span class="tl-year">{item.year}</span>
              <div class="tl-card">
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </li>
          {/each}
        </ol>
      </section>
    {/if}
  </main>
</Template>

<style>
  :root {
    --bg: #fff;
    --ink: #000;
    --muted: #6e756f;
    --line: #e7ebe7;
    --accent: #6f6c2f;
    --green: #5a8a6a;
  }

  :global(*) {
    box-sizing: border-box;
  }
  :global(html),
  :global(body) {
    margin: 0;
    padding: 0;
    background: var(--bg);
    color: var(--ink);
  }
  :global(body) {
    line-height: 1.6;
  }

  /* ── RSVP ── */
  .rsvp-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.4s ease;
    z-index: 49;
  }
  .rsvp-backdrop.open {
    opacity: 1;
    pointer-events: auto;
  }

  .rsvp-drawer {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 50;
    transform: translateY(100%);
    transition: transform 0.45s cubic-bezier(0.32, 0.72, 0, 1);
    max-height: 90vh;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .rsvp-drawer.open {
    transform: translateY(0);
  }

  .rsvp-drawer-top {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1rem 0;
    background: #54565b;
    position: relative;
  }
  .rsvp-handle {
    width: 40px;
    height: 4px;
    border-radius: 2px;
    background: rgba(255, 255, 255, 0.3);
  }
  .rsvp-close {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.6);
    font-size: 1.1rem;
    cursor: pointer;
    padding: 0.25rem 0.5rem;
    line-height: 1;
  }
  .rsvp-close:hover {
    color: #fff;
  }

  .rsvp-cta {
    padding: 0.75rem 2.5rem;
    border: 1px solid rgba(255, 255, 255, 0.75);
    background: transparent;
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.85rem;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    cursor: pointer;
    border-radius: 2px;
    transition:
      background 0.2s ease,
      border-color 0.2s ease;
  }
  .rsvp-cta:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: #fff;
  }

  @media (max-width: 767px) {
    .rsvp-drawer {
      max-height: 60vh;
    }
  }

  /* ── Cover ── */
  .cover {
    position: relative;
    min-height: 100vh;
    display: grid;
    place-items: center;
    background:
      linear-gradient(180deg, rgba(0, 0, 0, 0.72), rgba(0, 0, 0, 0.72)),
      url("/img/hero.jpg") center / cover no-repeat;
    border-bottom: none;
  }

  .photo-credit {
    position: absolute;
    bottom: 1rem;
    right: 1.25rem;
    font-size: 1rem;
    letter-spacing: 0.05em;
    color: rgba(255, 255, 255, 0.35);
    text-decoration: none;
    transition: color 0.2s ease;
  }
  .photo-credit:hover {
    color: rgba(255, 255, 255, 0.6);
  }

  .cover-inner {
    text-align: center;
    padding: 0 1rem 3rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2.5rem;
  }

  .logo {
    width: min(75vw, 720px);
    height: auto;
    display: block;
    filter: drop-shadow(0 2px 12px rgba(0, 0, 0, 0.2));
  }

  /* ── Floating feed stack ── */
  .feed-anchor {
    position: relative;
    z-index: 10;
    margin-top: -35vh;
    display: flex;
    justify-content: center;
    padding: 0 1.5rem 9rem;
  }

  .feed-stack {
    width: min(50vw, 660px);
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  @keyframes cardUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes cardUpNudge {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }
    40% {
      opacity: 1;
      transform: translateY(0);
    }
    55% {
      transform: translateY(-7px);
    }
    68% {
      transform: translateY(-3px);
    }
    82% {
      transform: translateY(-5px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes dot-ping {
    0% {
      transform: scale(1);
      opacity: 0.7;
    }
    75%,
    100% {
      transform: scale(3.2);
      opacity: 0;
    }
  }

  .feed-heading {
    margin: 0 0 0.75rem;
    padding: 0;
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.7);
  }

  .feed-empty {
    margin: 0;
    padding: 2rem 1.75rem;
    font-size: 0.9rem;
    color: var(--muted);
    text-align: center;
    background: #fff;
    border-radius: 20px;
    box-shadow:
      0 2px 4px rgba(0, 0, 0, 0.04),
      0 8px 20px rgba(0, 0, 0, 0.08);
    animation: cardUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  /* ── Post items — each is its own card ── */
  .post-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  .post-item {
    padding: 1.25rem 1.5rem;
    background: rgba(64, 50, 46, 0.2);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-radius: 20px;
    border: 1px solid #444;
    box-shadow:
      0 2px 4px rgba(0, 0, 0, 0.04),
      0 8px 20px rgba(0, 0, 0, 0.1),
      0 20px 40px rgba(0, 0, 0, 0.1);
    animation: cardUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .post-item {
    position: relative;
    overflow: hidden;
    border-radius: 32px;
    background: rgba(64, 50, 46, 0.2);
  }

  .post-item::before {
    content: "";
    position: absolute;
    inset: 0;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    background: rgba(64, 50, 46, 0.2);
    z-index: 0;
  }

  .post-item > * {
    position: relative;
    z-index: 1;
  }

  .post-item.unread {
    box-shadow:
      0 2px 4px rgba(0, 0, 0, 0.04),
      0 8px 20px rgba(90, 138, 106, 0.2),
      0 20px 40px rgba(0, 0, 0, 0.08);
    animation: cardUpNudge 1.1s cubic-bezier(0.16, 1, 0.3, 1) both;
  }

  .post-header {
    display: flex;
    align-items: center;
    gap: 0.65rem;
    margin-bottom: 0.7rem;
  }

  .post-avatar {
    flex-shrink: 0;
    width: 34px;
    height: 34px;
    border-radius: 50%;
    background: #e2f0e8;
    color: var(--green);
    font-size: 0.72rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    letter-spacing: 0.03em;
  }
  .post-avatar-img {
    object-fit: cover;
    background: none;
  }

  .post-byline {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
  }

  .post-author {
    font-size: 0.88rem;
    font-weight: 600;
    color: #e9eae9;
    line-height: 1.2;
  }

  .post-time {
    font-size: 0.75rem;
    color: #e9eae9;
  }

  .unread-dot {
    flex-shrink: 0;
    position: relative;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--green);
  }
  .unread-dot::after {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: var(--green);
    animation: dot-ping 2.5s ease-out 1s infinite;
  }

  .post-body {
    font-size: 0.95rem;
    color: #e9eae9;
    line-height: 1.6;
    margin-bottom: 0.75rem;
    overflow-wrap: break-word;
    word-break: break-word;
  }

  .expand-btn {
    display: inline;
    background: none;
    border: none;
    padding: 0;
    margin-left: 0.1em;
    color: #c5d9ca;
    font-size: inherit;
    font-weight: 500;
    cursor: pointer;
    line-height: inherit;
    letter-spacing: 0.01em;
  }
  .expand-btn:hover {
    color: rgba(0, 0, 0, 0.75);
  }
  .post-body :global(p) {
    margin: 0 0 0.35rem;
  }
  .post-body :global(p:last-child) {
    margin-bottom: 0;
  }
  .post-body :global(b),
  .post-body :global(strong) {
    font-weight: 600;
  }
  .post-body :global(i),
  .post-body :global(em) {
    font-style: italic;
  }
  .post-body :global(a) {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 3px;
    text-decoration-color: rgba(233, 234, 233, 0.45);
    transition: text-decoration-color 0.15s ease;
  }
  .post-body :global(a:hover) {
    text-decoration-color: rgba(233, 234, 233, 0.9);
  }

  .post-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .reaction-bar {
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .reaction-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    padding: 0.2rem 0.5rem;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: #f7fbf7;
    cursor: pointer;
    font-size: 0.95rem;
    line-height: 1;
    transition:
      background 0.15s,
      border-color 0.15s;
  }
  .reaction-btn:hover {
    background: #eef6f0;
    border-color: #c5d9ca;
  }
  .reaction-btn.active {
    background: #e2f0e8;
    border-color: var(--green);
  }

  .reaction-count {
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--muted);
  }
  .reaction-btn.active .reaction-count {
    color: var(--green);
  }

  .view-count {
    font-size: 0.72rem;
    color: var(--muted);
    white-space: nowrap;
    background: none;
    border: none;
    padding: 0;
    cursor: default;
    font-family: inherit;
    line-height: inherit;
  }
  .view-count:hover {
    color: rgba(233, 234, 233, 0.75);
  }

  .viewer-tooltip {
    position: fixed;
    transform: translate(-50%, calc(-100% - 10px));
    background: rgba(18, 16, 14, 0.93);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    color: #e9eae9;
    border-radius: 10px;
    padding: 0.5rem 0.8rem;
    font-size: 0.78rem;
    line-height: 1.7;
    pointer-events: none;
    z-index: 100;
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
    min-width: 80px;
  }
  .viewer-name {
    display: block;
  }

  /* ── Main content below feed ── */
  .page1 {
    max-width: 900px;
    margin: 0 auto;
    padding: 0 1rem 4rem;
  }

  .home-title {
    text-align: center;
    font-size: 1.4rem;
    font-weight: 400;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: var(--muted);
    margin: 6.5rem 0 2.5rem;
  }

  .lead {
    font-size: 1.1rem;
    color: var(--muted);
    text-align: center;
  }

  /* ── Timeline ── */
  .timeline {
    margin-top: 8rem;
    padding-bottom: 2rem;
  }

  .tl {
    list-style: none;
    margin: 0;
    padding: 0;
    position: relative;
  }
  .tl::before {
    content: "";
    position: absolute;
    left: 2rem;
    top: 0;
    bottom: 0;
    width: 1px;
    background: var(--line);
  }
  .tl-item {
    position: relative;
    padding-left: 5rem;
    padding-bottom: 2.5rem;
  }
  .tl-item:last-child {
    padding-bottom: 0;
  }
  .tl-item::before {
    content: "";
    position: absolute;
    left: calc(2rem - 4px);
    top: 0.35rem;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--accent);
    border: 2px solid var(--bg);
    box-shadow: 0 0 0 1px var(--line);
  }
  .tl-year {
    position: absolute;
    left: 0;
    top: 0.15rem;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.05em;
    color: var(--accent);
    width: 2rem;
    text-align: center;
  }
  .tl-card h3 {
    margin: 0.75rem 0;
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--ink);
  }
  .tl-card p {
    margin: 0;
    font-size: 0.95rem;
    color: var(--muted);
    line-height: 1.5;
  }

  @media (min-width: 768px) {
    .tl::before {
      left: 50%;
    }
    .tl-item {
      width: 50%;
      padding-left: 0;
      padding-right: 2.5rem;
      text-align: right;
    }
    .tl-item::before {
      left: auto;
      right: -5px;
    }
    .tl-year {
      left: auto;
      right: -3.5rem;
      width: auto;
      text-align: left;
    }
    .tl-item:nth-child(even) {
      margin-left: 50%;
      padding-left: 2.5rem;
      padding-right: 0;
      text-align: left;
    }
    .tl-item:nth-child(even)::before {
      right: auto;
      left: -5px;
    }
    .tl-item:nth-child(even) .tl-year {
      right: auto;
      left: -3.5rem;
      text-align: right;
    }
  }

  @media (max-width: 680px) {
    .feed-anchor {
      margin-top: -30vh;
      padding: 0 1rem 2rem;
    }
    .feed-stack {
      width: 100%;
    }
    .post-item {
      padding: 1rem 1.1rem;
      border-radius: 16px;
    }
    .feed-heading {
      padding: 0;
    }
  }
</style>
