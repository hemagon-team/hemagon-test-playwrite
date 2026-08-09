import { z } from 'zod';
import {
  SWISS_PARTICIPANTS_MAX,
  SWISS_PARTICIPANTS_MIN,
  swissRecommendedRounds,
} from '../data/swissData';
import { ScenarioBaseSchema } from './scenarioBase.schema';

/**
 * A Swiss scenario is fully described by its roster: the product derives how many
 * rounds to run ("Recommended rounds"), so `rounds` is computed rather than
 * configured and the two can never drift apart.
 */
export const SwissScenarioSchema = ScenarioBaseSchema
  .extend({
    participantsNumber: z.number().int()
      .min(SWISS_PARTICIPANTS_MIN)
      .max(SWISS_PARTICIPANTS_MAX),
  })
  .transform(scenario => ({
    ...scenario,
    rounds: swissRecommendedRounds(scenario.participantsNumber),
  }));

export type SwissScenario = z.infer<typeof SwissScenarioSchema>;
