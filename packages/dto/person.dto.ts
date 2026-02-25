export type PersonRole =
  | "GUEST"
  | "TOASTMASTER"
  | "PERSON_OF_HONOR"
  | "PARENT"
  | "VENDOR"
  | "SPOUSE_TO_BE";

export type RsvpStatus = "YES" | "NO";

/** Shape returned per-person by /api/auth/me */
export type MemberDto = {
  id: string;
  friendlyName: string;
  rsvp: RsvpStatus | null;
  roles: PersonRole[];
};

/** Shape returned by /api/persons */
export type PersonDto = {
  id: string;
  friendlyName: string;
  fullName: string;
  email: string;
  phone?: string;
  invitationCode?: string;
  addressLine1?: string;
  zipcode?: string;
  city?: string;
  country?: string;
  title?: string;
  roles: PersonRole[];
  rsvp: RsvpStatus | null;
  saveTheDateSent: boolean;
  createdAt: string;
  updatedAt: string;
  imagePath: string;
  thumbPath: string;
};
