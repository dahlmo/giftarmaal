export type PersonRoles = [
  "GUEST",
  "TOASTMASTER",
  "PERSON_OF_HONOR",
  "PARENT",
  "VENDOR",
  "SPOUSE_TO_BE",
];
export type RsvpStatus = ["YES", "NO"];
export type Person = {
  id: string;
  friendlyName: string;
  fullName: string;
  email: string;
  phone?: string;
  image?: string;
  invitationCode?: string;
  addressLine1?: string;
  zipcode?: string;
  city?: string;
  country?: string;
  title: string;
  roles: (typeof PersonRoles)[number][];
  rsvp: (typeof RsvpStatus)[number];
  saveTheDateSent: boolean;
  createdAt: string;
  updatedAt: string;
};

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
