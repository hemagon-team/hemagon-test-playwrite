/**
 * Swiss system stage arithmetic, verified against the organizer stage card on stage:
 * every round pairs the whole roster, so an odd roster produces one "empty fight"
 * (`fighter2.user === null`) that the backend auto-resolves per the stage's
 * "Empty fight result (odd fighters count)" setting.
 */

/**
 * Roster bounds our scenarios exercise: two fighters are the smallest pairing, and
 * 37 is the largest roster we run so a single scenario stays inside its time budget.
 */
export const SWISS_PARTICIPANTS_MIN = 2;
export const SWISS_PARTICIPANTS_MAX = 37;

/** Offset in the product's "Recommended rounds" readout: ceil(log2(N)) + 2. */
export const SWISS_RECOMMENDED_ROUNDS_OFFSET = 2;

/** Auto-resolved empty fight — the lone fighter is credited a win with this score. */
export const SWISS_EMPTY_FIGHT_RESULT = 'Win';
export const SWISS_EMPTY_FIGHT_SCORE  = 1;

function ceilLog2(value: number): number {
  let bits = 0;
  while (2 ** bits < value) bits++;
  return bits;
}

/** "Recommended rounds" as the stage card computes it. */
export function swissRecommendedRounds(participants: number): number {
  assertParticipants(participants);
  return ceilLog2(participants) + SWISS_RECOMMENDED_ROUNDS_OFFSET;
}

/** Fights the backend creates per round, including the empty fight on an odd roster. */
export function swissFightsPerRound(participants: number): number {
  assertParticipants(participants);
  return Math.ceil(participants / 2);
}

/** Bouts with two fighters — the only ones that get a Run button on the conduct page. */
export function swissRealBoutsPerRound(participants: number): number {
  assertParticipants(participants);
  return Math.floor(participants / 2);
}

export function swissHasEmptyFight(participants: number): boolean {
  return participants % 2 === 1;
}

/**
 * Wins handed out per round: every real bout yields one, and the empty fight
 * credits its lone fighter. Losses come only from real bouts.
 */
export function swissWinsPerRound(participants: number): number {
  return swissFightsPerRound(participants);
}

export function swissLossesPerRound(participants: number): number {
  return swissRealBoutsPerRound(participants);
}

/**
 * A fighter has `participants - 1` possible opponents, so a rematch is only
 * unavoidable once the stage runs more rounds than that. Below that line the
 * pairing algorithm is expected to keep every pairing unique.
 */
export function swissAllowsUniquePairings(participants: number, rounds: number): boolean {
  return rounds <= participants - 1;
}

/**
 * One fighter sits out per round on an odd roster, so byes can stay unique only
 * while the stage runs no more rounds than it has fighters.
 */
export function swissAllowsUniqueByes(participants: number, rounds: number): boolean {
  return rounds <= participants;
}

function assertParticipants(participants: number): void {
  if (!Number.isInteger(participants) || participants < SWISS_PARTICIPANTS_MIN) {
    throw new RangeError(
      `participants must be an integer >= ${SWISS_PARTICIPANTS_MIN}, got ${participants}`,
    );
  }
}
