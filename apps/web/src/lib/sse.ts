import { readable } from "svelte/store";

// Single shared EventSource — avoids opening multiple connections
type Handler = (data: any) => void;
const _listeners = new Map<string, Set<Handler>>();
let _es: EventSource | null = null;

function ensureEs() {
  if (_es || globalThis.window === undefined) return;
  _es = new EventSource("/api/events");
  _es.addEventListener("message", (ev: MessageEvent) => {
    try {
      const parsed = JSON.parse(ev.data) || {};
      const type = parsed.type as string | undefined;
      if (type) _listeners.get(type)?.forEach((fn) => fn(parsed));
    } catch {
      // ignore malformed events
    }
  });
}

function onSseEvent(type: string, fn: Handler): () => void {
  if (!_listeners.has(type)) _listeners.set(type, new Set());
  _listeners.get(type)!.add(fn);
  ensureEs();
  return () => _listeners.get(type)!.delete(fn);
}

export type SseContentSlugEvent = { slug: string; ts: number };
export const sseContentSlug = readable<SseContentSlugEvent | null>(null, (set) => {
  return onSseEvent("content-updated", ({ slug }) => {
    if (slug) set({ slug, ts: Date.now() });
  });
});

export type SsePostCreatedEvent = { id: number; ts: number };
export const ssePostCreated = readable<SsePostCreatedEvent | null>(null, (set) => {
  return onSseEvent("post:created", ({ id }) => {
    if (id) set({ id, ts: Date.now() });
  });
});
