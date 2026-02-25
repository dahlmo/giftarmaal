import type { PersonDto, PersonRole, RsvpStatus } from "@giftarmaal/dto";

// Re-export shared types under the names the rest of the web app uses
export type { PersonRole as PersonRoles, RsvpStatus };
export type Person = PersonDto;

export async function listPersons(): Promise<Person[]> {
  const res = await fetch("/api/persons");
  const data = await res.json();
  return data.persons;
}
export async function addPerson(
  person: Omit<Person, "id" | "createdAt" | "updatedAt">,
): Promise<Person> {
  const res = await fetch("/api/persons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(person),
  });
  const data = await res.json();
  return data.person;
}
export async function updatePerson(
  id: string,
  updates: Partial<Person>,
): Promise<Person> {
  const res = await fetch(`/api/persons/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });
  const data = await res.json();
  return data.person;
}
export async function deletePerson(id: string): Promise<void> {
  await fetch(`/api/persons/${id}`, { method: "DELETE" });
}
