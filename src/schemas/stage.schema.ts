import { z } from 'zod';

export const FIGHT_RESULT_NONE = 'NONE';
/** Bronze bout auto-resolved when "Hold a fight for the third place" is off. */
export const FIGHT_RESULT_BOTH_WIN = 'BOTH_WIN';

/** Users appear as ids in build-round responses and as populated objects in GET. */
const StageUserSchema = z.union([
  z.string().min(1),
  z.object({ _id: z.string().min(1) }).passthrough(),
]);

/** SWISS empty fight (odd roster) carries `user: null` on the unpaired side. */
const StageFighterSchema = z.object({
  user:   z.union([z.null(), StageUserSchema]).optional(),
  scores: z.number().default(0),
}).passthrough();

const StageFightSchema = z.object({
  _id:      z.string().min(1),
  result:   z.enum(['NONE', 'F1_WIN', 'F2_WIN', 'BOTH_WIN', 'DRAW']),
  fighter1: StageFighterSchema.optional(),
  fighter2: StageFighterSchema.optional(),
}).passthrough();

/**
 * A "pool" inside a stage document. On POOL stages it is a round-robin group;
 * on ELIMINATION stages every bracket bout is its own pool (`side` 0/1 = bracket
 * sides, `side` 2 = finals where `index` 0 is gold and 1 is bronze).
 */
const StagePoolSchema = z.object({
  _id:         z.string().min(1),
  title:       z.string(),
  index:       z.number().int(),
  side:        z.number().int(),
  round:       z.number().int(),
  users:       z.array(StageUserSchema),
  fights:      z.array(StageFightSchema),
  usersPlaces: z.array(z.number()).optional().default([]),
}).passthrough();

export const StageApiResponseSchema = z.object({
  _id:   z.string().min(1),
  type:  z.string(),
  order: z.number().int(),
  pools: z.array(StagePoolSchema),
  settings: z.object({
    fightForThirdPlace: z.boolean().optional(),
  }).passthrough().optional(),
}).passthrough();

export const StageListApiResponseSchema = z.array(StageApiResponseSchema);

export type StageApiResponse = z.infer<typeof StageApiResponseSchema>;
export type StageFight = z.infer<typeof StageFightSchema>;
export type StageFighter = z.infer<typeof StageFighterSchema>;

export function stageUserId(user: z.infer<typeof StageUserSchema>): string {
  return typeof user === 'string' ? user : user._id;
}

/** Display name of a populated fighter; `null` on the empty side of a SWISS bye. */
export function stageFighterName(fighter: StageFighter | undefined): string | null {
  const user = fighter?.user;
  if (!user || typeof user === 'string') return null;
  const name = (user as { name?: unknown }).name;
  return typeof name === 'string' ? name : null;
}

/** Fighter's user id; `null` on the empty side of a SWISS bye. */
export function stageFighterId(fighter: StageFighter | undefined): string | null {
  const user = fighter?.user;
  if (!user) return null;
  return stageUserId(user);
}
