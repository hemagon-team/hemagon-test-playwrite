import { z } from 'zod';

/**
 * Fields every declarative tournament scenario carries. The object is strict, so a
 * misspelled key in a scenario JSON fails loudly instead of being silently ignored.
 */
export const ScenarioBaseSchema = z.object({
  /** Also the test title suffix, so it should read like `24p-4pool-8adv-rating`. */
  id:             z.string().min(1),
  description:    z.string().optional(),
  /** Stage "Fight time" in seconds; only worth setting to override the default. */
  stageFightTime: z.number().int().positive().default(120),
}).strict();
