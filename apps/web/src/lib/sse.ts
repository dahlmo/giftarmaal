import { readable } from "svelte/store";

// Accept SSR-safe import
export type SseEvent = { type?: string; data?: any; slug?: string };

export const sseContentSlug = readable<string | null>(null, (set) => {
  if (typeof window === "undefined") return;
  const es = new window.EventSource("/api/events");

  es.addEventListener("message", (ev: MessageEvent) => {
    console.debug("event received", ev.data);
    try {
      const { type, data, slug } = JSON.parse(ev.data) || {};
      if (type === "content-updated" && slug) set(slug);
    } catch (e) {
      console.error("Failed to parse SSE event", e);
    }
  });

  return () => es.close();
});
