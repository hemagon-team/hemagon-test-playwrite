/** Wait for parallel PUT /organizer/fights after "RND results" on a pool conduct page. */
export const POOL_RND_RESULTS_TIMEOUT_MS = 90_000;

/**
 * Target fighters per pool in tests. Hemagon limited pools allow up to 7, but our
 * scenarios standardize on 4–6 so round-robin size and conduct time stay predictable.
 */
export const POOL_FIGHTERS_MIN = 4;
export const POOL_FIGHTERS_MAX = 6;

/** Nomination enrollment for `poolCount` pools at `fightersPerPool` each (4–6). */
export function enrollmentForPools(
  poolCount: number,
  fightersPerPool: number,
): number {
  if (fightersPerPool < POOL_FIGHTERS_MIN || fightersPerPool > POOL_FIGHTERS_MAX) {
    throw new RangeError(
      `fightersPerPool must be ${POOL_FIGHTERS_MIN}–${POOL_FIGHTERS_MAX}, got ${fightersPerPool}`,
    );
  }
  return poolCount * fightersPerPool;
}

/** Round-robin bout count for `n` fighters in one pool. */
export function roundRobinFights(fighters: number): number {
  return (fighters * (fighters - 1)) / 2;
}

/** UI round number for gold/bronze finals when `advancing` is a power of two (8 → 3). */
export function eliminationFinalsRound(advancing: number): number {
  if (advancing < 2 || (advancing & (advancing - 1)) !== 0) {
    throw new RangeError(`advancing must be a power of two >= 2, got ${advancing}`);
  }
  return Math.log2(advancing);
}

/** Finals bouts on the elimination card (gold + optional bronze). */
export function eliminationFinalsFights(fightForThirdPlace = true): number {
  return fightForThirdPlace ? 2 : 1;
}
