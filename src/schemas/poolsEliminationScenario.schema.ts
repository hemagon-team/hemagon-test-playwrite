import { z } from 'zod';
import { POOL_FIGHTERS_MAX, POOL_FIGHTERS_MIN } from '../data/poolData';
import { SCENARIO_ADVANCE_COUNTS } from '../data/scenarioData';
import { ScenarioBaseSchema } from './scenarioBase.schema';

const AdvanceCountSchema = z.number().int().refine(
  (n): n is typeof SCENARIO_ADVANCE_COUNTS[number] =>
    (SCENARIO_ADVANCE_COUNTS as readonly number[]).includes(n),
  { message: `advanceCount must be one of ${SCENARIO_ADVANCE_COUNTS.join(', ')}` },
);

const MinimumFromPoolSchema = z.union([
  z.literal('any'),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

export const PoolsEliminationScenarioSchema = ScenarioBaseSchema
  .extend({
    participantsNumber:   z.number().int().positive(),
    poolsCount:           z.number().int().positive(),
    advanceCount:         AdvanceCountSchema,
    minimumFromEachPool:  MinimumFromPoolSchema,
    thirdPlace:           z.boolean().default(true),
  })
  .refine(s => s.advanceCount <= s.participantsNumber, {
    message: 'advanceCount must not exceed participantsNumber',
  })
  .refine(
    s =>
      Math.floor(s.participantsNumber / s.poolsCount) >= POOL_FIGHTERS_MIN &&
      Math.ceil(s.participantsNumber / s.poolsCount) <= POOL_FIGHTERS_MAX,
    {
      message:
        `pool size must stay within ${POOL_FIGHTERS_MIN}–${POOL_FIGHTERS_MAX} fighters ` +
        '(participantsNumber / poolsCount out of range)',
    },
  )
  .refine(
    s => s.minimumFromEachPool === 'any'
      || s.minimumFromEachPool * s.poolsCount <= s.advanceCount,
    {
      message: 'minimumFromEachPool × poolsCount must not exceed advanceCount',
    },
  );

export type PoolsEliminationScenario = z.infer<typeof PoolsEliminationScenarioSchema>;
