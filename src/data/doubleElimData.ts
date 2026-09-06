/** Finals mode on the Double Elimination add-stage form (`#input-stage-finalsMode-*`). */
export const DOUBLE_ELIM_FINALS_MODES = ['BO_1', 'BO_3'] as const;
export type DoubleElimFinalsMode = typeof DOUBLE_ELIM_FINALS_MODES[number];

/** Smallest roster in the declarative matrix (winner bracket R1 = N/2 fights). */
export const DOUBLE_ELIM_MIN_PARTICIPANTS = 16;

export function isPowerOfTwo(n: number): boolean {
  return n >= 2 && (n & (n - 1)) === 0;
}

/** Winner-bracket round-1 fight count when all N pool fighters advance. */
export function winnerBracketRoundOneFights(participants: number): number {
  assertPowerOfTwoParticipants(participants);
  return participants / 2;
}

/** Fights on one bracket side (left or right) in winner-bracket round 1. */
export function winnerBracketSideRoundOneFights(participants: number): number {
  return winnerBracketRoundOneFights(participants) / 2;
}

/**
 * Standard elimination seed order for N (power of two): 1 vs N, N/2 vs N/2+1, …
 * Matches Hemagon `usersPlaces` after pools → double elim build-next-stage.
 */
export function bracketSeedOrder(participants: number): number[] {
  assertPowerOfTwoParticipants(participants);

  if (participants === 2) return [1, 2];

  const half = bracketSeedOrder(participants / 2);
  const order: number[] = [];

  for (const seed of half) {
    order.push(seed);
    order.push(participants + 1 - seed);
  }

  return order;
}

/** Round-1 seed pairs in UI order (left side fights first, then right). */
export function standardBracketSeedPairs(participants: number): Array<[number, number]> {
  const seeds = bracketSeedOrder(participants);
  const pairs: Array<[number, number]> = [];

  for (let i = 0; i < seeds.length; i += 2) {
    pairs.push([seeds[i], seeds[i + 1]]);
  }

  return pairs;
}

/** API `side: 0` — left half of winner-bracket round 1. */
export function leftBracketSeedPairs(participants: number): Array<[number, number]> {
  const pairs = standardBracketSeedPairs(participants);
  return pairs.slice(0, pairs.length / 2);
}

/** API `side: 1` — right half of winner-bracket round 1. */
export function rightBracketSeedPairs(participants: number): Array<[number, number]> {
  const pairs = standardBracketSeedPairs(participants);
  return pairs.slice(pairs.length / 2);
}

function assertPowerOfTwoParticipants(participants: number): void {
  if (!isPowerOfTwo(participants)) {
    throw new RangeError(
      `participants must be a power of two >= 2, got ${participants}`,
    );
  }
}
