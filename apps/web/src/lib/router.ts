import { writable } from 'svelte/store';

export const currentPath = writable<string>(typeof window !== 'undefined' ? window.location.pathname : '/');

export function navigate(to: string) {
  if (typeof window === 'undefined') return;
  if (window.location.pathname !== to) {
    window.history.pushState({}, '', to);
    currentPath.set(to);
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => currentPath.set(window.location.pathname));
}
