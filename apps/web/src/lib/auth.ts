import { writable, derived } from "svelte/store";

export const authed = writable(false);
export const roles = writable<string[]>([]);
export const isSpouse = derived(roles, ($roles) => $roles.includes("SPOUSE_TO_BE"));
