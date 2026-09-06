import { z } from 'zod';
import {
  DOUBLE_ELIM_FINALS_MODES,
  DOUBLE_ELIM_MIN_PARTICIPANTS,
  isPowerOfTwo,
} from '../data/doubleElimData';
import { POOL_FIGHTERS_MAX, POOL_FIGHTERS_MIN } from '../data/poolData';
import { ScenarioBaseSchema } from './scenarioBase.schema';

const FinalsModeSchema = z.enum(DOUBLE_ELIM_FINALS_MODES);

const TillFinalsSchema = z.enum(['yes', 'no', 'qualification']);

export const PoolsDoubleEliminationScenarioSchema = ScenarioBaseSchema
  .extend({
    participantsNumber: z.number().int().positive(),
    poolsCount:           z.number().int().positive(),
    /** Double Elimination stage — `#input-stage-finalsMode-bo1|bo3`. */
    finalsMode:           FinalsModeSchema.default('BO_1'),
    /** Double Elimination stage — "To the finals" radio; product default is yes. */
    tillFinals:           TillFinalsSchema.default('yes'),
  })
  .refine(s => isPowerOfTwo(s.participantsNumber), {
    message: 'participantsNumber must be a power of two (16, 32, 64, …)',
  })
  .refine(s => s.participantsNumber >= DOUBLE_ELIM_MIN_PARTICIPANTS, {
    message: `participantsNumber must be at least ${DOUBLE_ELIM_MIN_PARTICIPANTS}`,
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
  );

export type PoolsDoubleEliminationScenario = z.infer<
  typeof PoolsDoubleEliminationScenarioSchema
>;
