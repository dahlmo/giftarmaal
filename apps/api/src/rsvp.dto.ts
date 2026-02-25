export class SubmitRsvpDto {
  members!: { id: string; attending: "yes" | "no"; dietary: string }[];
  comment?: string;
}
