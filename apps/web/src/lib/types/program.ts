export type ProgramEntryInfo = {
  slug: string;
  bookableFrom: string | null;
  bookableTo: string | null;
  bookableSlots: number | null;
  bookedCount: number;
  myBookings: { personId: string; status: string }[];
};
