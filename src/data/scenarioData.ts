import { eliminationFinalsFights, eliminationFinalsRound } from './poolData';

/** Allowed "Goes next stage" presets (powers of two from 4). */
export const SCENARIO_ADVANCE_COUNTS = [4, 8, 16, 32] as const;
export type ScenarioAdvanceCount = typeof SCENARIO_ADVANCE_COUNTS[number];

/** Fight count in elimination UI round `round` (1-based) when `advance` is a power of two. */
export function eliminationRoundFightCount(
  advance: ScenarioAdvanceCount,
  round: number,
): number {
  if (round < 1 || round > eliminationFinalsRound(advance)) {
    throw new RangeError(`round ${round} out of range for advance ${advance}`);
  }
  return advance / 2 ** round;
}

/** Total scored elimination bouts through gold/bronze (pools excluded). */
export function totalEliminationScoredBouts(
  advance: ScenarioAdvanceCount,
  fightForThirdPlace = true,
): number {
  const finalsRound = eliminationFinalsRound(advance);
  let total         = 0;

  for (let round = 1; round <= finalsRound; round++) {
    if (round === finalsRound) {
      total += eliminationFinalsFights(fightForThirdPlace);
    } else {
      total += eliminationRoundFightCount(advance, round);
    }
  }

  return total;
}
