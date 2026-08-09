import { z } from 'zod';

export const RingApiResponseSchema = z.object({
  _id:        z.string().min(1),
  title:      z.string().min(1),
  tournament: z.string().min(1),
}).passthrough();

export const RingListResponseSchema = z.object({
  items: z.array(RingApiResponseSchema),
  count: z.number().int().nonnegative(),
}).passthrough();

export type RingApiResponse = z.infer<typeof RingApiResponseSchema>;
