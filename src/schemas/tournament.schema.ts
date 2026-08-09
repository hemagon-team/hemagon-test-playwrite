import { z } from 'zod';

export const SelectOptionSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
});

export const TournamentKeyboardSettingsSchema = z.object({
  pointLeftAdd:     z.string().min(1),
  pointLeftRemove:  z.string().min(1),
  pointRightAdd:    z.string().min(1),
  pointRightRemove: z.string().min(1),
  toggleTimer:      z.string().min(1),
  doubleAdd:        z.string().min(1),
  doubleRemove:     z.string().min(1),
  boutAdd:          z.string().min(1),
  boutRemove:       z.string().min(1),
}).passthrough();

const tournamentApiResponseShape = {
  _id:              z.string().min(1),
  id:               z.string().min(1).optional(),
  idString:         z.string().min(1),
  title:            z.string().min(1),
  country:          SelectOptionSchema,
  city:             SelectOptionSchema,
  test:             z.boolean(),
  nominations:      z.array(z.unknown()).optional(),
  keyboardSettings: TournamentKeyboardSettingsSchema.optional(),
} as const;

/** Any GET/list response — state may change after creation. */
export const TournamentApiResponseSchema = z.object({
  ...tournamentApiResponseShape,
  state: z.string().min(1),
}).passthrough();

export type TournamentApiResponse = z.infer<typeof TournamentApiResponseSchema>;

/** POST create response — new tournaments start as Hidden (`DEVELOPING`). */
export const TournamentCreatedApiResponseSchema = z.object({
  ...tournamentApiResponseShape,
  state: z.literal('DEVELOPING'),
}).passthrough();

export type TournamentCreatedApiResponse = z.infer<typeof TournamentCreatedApiResponseSchema>;

/** GET/PUT response when tournament is in a known state. */
export function tournamentApiResponseWithStateSchema<const S extends string>(state: S) {
  return TournamentApiResponseSchema.extend({ state: z.literal(state) });
}

export const TournamentListResponseSchema = z.object({
  items: z.array(z.unknown()),
  count: z.number().int().nonnegative().optional(),
}).passthrough();
