export type RsvpMemberPayload = {
  id: string;
  attending: "yes" | "no";
  dietary: string;
};

export type RsvpSubmitPayload = {
  members: RsvpMemberPayload[];
  comment?: string;
};
