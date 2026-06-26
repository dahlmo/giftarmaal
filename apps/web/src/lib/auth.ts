import { writable, derived } from "svelte/store";

export const authed = writable(false);
export const roles = writable<string[]>([]);
export const isSpouse = derived(roles, ($roles) => $roles.includes("SPOUSE_TO_BE"));
export const isAdmin = derived(roles, ($roles) =>
  $roles.includes("SPOUSE_TO_BE") || $roles.includes("TOASTMASTER"),
);
