import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
  const res = await fetch('/api/message');
  const data = await res.json().catch(() => ({ message: 'Error parsing response' }));
  return { message: data?.message ?? 'No message' };
};
