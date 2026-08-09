import { z } from 'zod';

export const NominationApiResponseSchema = z.object({
  _id:                  z.string().min(1),
  idString:             z.string().min(1),
  title:                z.string().min(1),
  tournament:           z.union([
    z.string().min(1),
    z.object({ _id: z.string().min(1) }).passthrough(),
  ]),
  isTeam:               z.boolean(),
  twoThirdsPlace:       z.boolean(),
  isFightingNomination: z.boolean().optional(),
}).passthrough();

export type NominationApiResponse = z.infer<typeof NominationApiResponseSchema>;
