import { expect } from '@playwright/test';
import {
  swissAllowsUniqueByes,
  swissAllowsUniquePairings,
  swissFightsPerRound,
  swissHasEmptyFight,
  swissLossesPerRound,
  swissWinsPerRound,
} from '../data/swissData';
import type { SwissScenario } from '../schemas/swissScenario.schema';
import type { StageApiResponse } from '../schemas/stage.schema';
import type { StandingsRow } from '../ui/components/standings/StandingsTableSection';
import { tallyCoef, tallyFights, type FighterTally } from './fightTally';

/** Standings recomputed from the stage's fight documents. */
export interface ExpectedStanding {
  name:         string;
  fights:       number;
  wins:         number;
  losses:       number;
  draws:        number;
  pointsEarned: number;
  pointsLost:   number;
  /** The rating table's "Match Points" column equals the win count. */
  matchPoints:  number;
  /** The rating table's "Coef." column equals points earned minus points lost. */
  coef:         number;
}

/**
 * Asserts the Swiss stage is fully conducted — `scenario.rounds` rounds, each with
 * the whole roster and `ceil(N/2)` decided fights — and returns the standings the
 * UI is expected to show, recomputed from the fight documents.
 *
 * Also checks the two properties that make a pairing "Swiss" rather than random:
 * no two fighters ever meet twice, and nobody sits out more than once.
 */
export function assertSwissStageCompleted(
  stage: StageApiResponse,
  scenario: Pick<SwissScenario, 'participantsNumber' | 'rounds'>,
): ExpectedStanding[] {
  const { participantsNumber, rounds } = scenario;
  const expectedFights = swissFightsPerRound(participantsNumber);

  const byRound = [...stage.pools].sort((a, b) => a.round - b.round);

  expect(byRound.length, 'conducted Swiss rounds').toBe(rounds);

  const tallies    = new Map<string, FighterTally>();
  const metInRound = new Map<string, number[]>();
  const byeRounds  = new Map<string, number[]>();

  byRound.forEach((round, index) => {
    const roundNumber = index + 1;
    const label       = `round ${roundNumber}`;

    expect(round.round, `${label}: API round index`).toBe(index);
    expect(round.users.length, `${label}: whole roster is paired`).toBe(participantsNumber);
    expect(round.fights.length, `${label}: fight count`).toBe(expectedFights);

    for (const pairing of tallyFights(round.fights, tallies, label)) {
      if (pairing.secondId === null) {
        append(byeRounds, pairing.firstId, roundNumber);
        continue;
      }
      append(metInRound, pairKey(pairing.firstId, pairing.secondId), roundNumber);
    }
  });

  const nameOf = (id: string): string => tallies.get(id)?.name ?? id;

  assertPairingsUnique(metInRound, participantsNumber, rounds, nameOf);
  assertByes(byeRounds, participantsNumber, rounds, nameOf);

  const standings = [...tallies.values()].map(toStanding);

  expect(standings.length, 'fighters in standings').toBe(participantsNumber);

  // The UI tables identify fighters by name, so the comparison below is only sound
  // while the roster has no namesakes.
  const names = standings.map(fighter => fighter.name);
  expect(new Set(names).size, 'roster must not contain namesakes').toBe(names.length);

  for (const fighter of standings) {
    expect(fighter.fights, `${fighter.name}: one fight per round`).toBe(rounds);
    expect(
      fighter.wins + fighter.losses + fighter.draws,
      `${fighter.name}: wins + losses + draws must equal fights`,
    ).toBe(rounds);
  }

  expect(sumOf(standings, s => s.wins), 'wins awarded across the stage')
    .toBe(swissWinsPerRound(participantsNumber) * rounds);
  expect(sumOf(standings, s => s.losses), 'losses awarded across the stage')
    .toBe(swissLossesPerRound(participantsNumber) * rounds);

  return standings;
}

/**
 * Compares a rendered standings table against the recomputed expectation. Only the
 * columns the view actually renders are compared, so this fits the organizer rating
 * panel, the public Rating tab, and public Final standings alike.
 */
export function assertStandingsMatchExpected(
  rows: StandingsRow[],
  expected: ExpectedStanding[],
  label: string,
): void {
  expect(rows.length, `${label}: row count`).toBe(expected.length);

  for (const row of rows) {
    expect(row.techLosses, `${label}: ${row.name} must have no technical losses`).toBe(0);
  }

  // Column presence is identical across rows (it comes from the table header), so
  // the first row is a faithful sample of which columns this view renders.
  const actualKeys   = rows.map(row => rowKey(row)).sort();
  const expectedKeys = expected
    .map(fighter => expectedKey(fighter, rows[0]))
    .sort();

  expect(actualKeys, `${label}: standings must match the fight results`).toEqual(expectedKeys);
}

/**
 * Ranking order: match points descending, then coefficient (points earned minus
 * lost) descending. Fighters equal on both may appear in any order.
 */
export function assertStandingsOrdering(rows: StandingsRow[], label: string): void {
  expect(rows.length, `${label}: standings must not be empty`).toBeGreaterThan(0);

  rows.forEach((row, index) => {
    expect(row.rank, `${label}: rank column must count from 1`).toBe(index + 1);
  });

  for (let index = 1; index < rows.length; index++) {
    const previous = rows[index - 1];
    const current  = rows[index];

    const previousPoints = matchPointsOf(previous);
    const currentPoints  = matchPointsOf(current);

    expect(
      currentPoints,
      `${label}: ${current.name} outranks ${previous.name} on match points`,
    ).toBeLessThanOrEqual(previousPoints);

    if (previousPoints !== currentPoints) continue;

    const previousCoef = coefOf(previous);
    const currentCoef  = coefOf(current);
    if (previousCoef === undefined || currentCoef === undefined) continue;

    expect(
      currentCoef,
      `${label}: ${current.name} ties ${previous.name} on match points `
      + 'but has a better coefficient',
    ).toBeLessThanOrEqual(previousCoef);
  }
}

/** Two views of the same stage must rank the same fighters in the same order. */
export function assertStandingsParity(
  left: StandingsRow[],
  right: StandingsRow[],
  leftLabel: string,
  rightLabel: string,
): void {
  const shape = (rows: StandingsRow[]) => rows.map(row => ({
    name:   row.name,
    fights: row.fights,
    wins:   row.wins,
    losses: row.losses,
    draws:  row.draws,
  }));

  expect(shape(right), `${rightLabel} must match ${leftLabel}`).toEqual(shape(left));
}

/** Same two fighters must never be paired twice within a stage. */
function assertPairingsUnique(
  metInRound: Map<string, number[]>,
  participants: number,
  rounds: number,
  nameOf: (id: string) => string,
): void {
  if (!swissAllowsUniquePairings(participants, rounds)) return;

  const rematches = [...metInRound.entries()]
    .filter(([, roundNumbers]) => roundNumbers.length > 1)
    .map(([key, roundNumbers]) => {
      const [first, second] = key.split('|');
      return `${nameOf(first)} vs ${nameOf(second)} in rounds ${roundNumbers.join(', ')}`;
    })
    .sort();

  expect(rematches, 'Swiss pairings must never repeat').toEqual([]);
}

/**
 * An odd roster leaves exactly one fighter unpaired per round, and the pairing
 * algorithm must spread those byes over different fighters.
 */
function assertByes(
  byeRounds: Map<string, number[]>,
  participants: number,
  rounds: number,
  nameOf: (id: string) => string,
): void {
  const total = [...byeRounds.values()].reduce((sum, list) => sum + list.length, 0);

  expect(total, 'empty fights across the stage')
    .toBe(swissHasEmptyFight(participants) ? rounds : 0);

  if (!swissAllowsUniqueByes(participants, rounds)) return;

  const repeated = [...byeRounds.entries()]
    .filter(([, roundNumbers]) => roundNumbers.length > 1)
    .map(([id, roundNumbers]) => `${nameOf(id)} in rounds ${roundNumbers.join(', ')}`)
    .sort();

  expect(repeated, 'no fighter may sit out more than once').toEqual([]);
}

function pairKey(first: string, second: string): string {
  return [first, second].sort().join('|');
}

function append(index: Map<string, number[]>, key: string, value: number): void {
  const existing = index.get(key);
  if (existing) {
    existing.push(value);
    return;
  }
  index.set(key, [value]);
}

/**
 * Match points mirror the win count. Random results never produce draws, so the
 * unknown draw weighting stays out of the model — a draw would fail loudly here.
 */
function toStanding(tally: FighterTally): ExpectedStanding {
  expect(
    tally.draws,
    `${tally.name}: draws are not expected from random results`,
  ).toBe(0);

  return {
    name:         tally.name,
    fights:       tally.fights,
    wins:         tally.wins,
    losses:       tally.losses,
    draws:        tally.draws,
    pointsEarned: tally.pointsEarned,
    pointsLost:   tally.pointsLost,
    matchPoints:  tally.wins,
    coef:         tallyCoef(tally),
  };
}

/** Serializes only the columns a view renders, so one key format fits all three. */
function rowKey(row: StandingsRow): string {
  return [
    row.name, row.fights, row.wins, row.losses, row.draws, row.pointsEarned,
    row.matchPoints ?? '-', row.coef ?? '-', row.pointsLost ?? '-',
  ].join('|');
}

function expectedKey(fighter: ExpectedStanding, sample: StandingsRow | undefined): string {
  return [
    fighter.name, fighter.fights, fighter.wins, fighter.losses, fighter.draws,
    fighter.pointsEarned,
    sample?.matchPoints === undefined ? '-' : fighter.matchPoints,
    sample?.coef === undefined ? '-' : fighter.coef,
    sample?.pointsLost === undefined ? '-' : fighter.pointsLost,
  ].join('|');
}

function matchPointsOf(row: StandingsRow): number {
  return row.matchPoints ?? row.wins;
}

function coefOf(row: StandingsRow): number | undefined {
  if (row.coef !== undefined) return row.coef;
  if (row.pointsLost === undefined) return undefined;
  return row.pointsEarned - row.pointsLost;
}

function sumOf(items: ExpectedStanding[], pick: (item: ExpectedStanding) => number): number {
  return items.reduce((total, item) => total + pick(item), 0);
}
