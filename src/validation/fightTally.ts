import { expect } from '@playwright/test';
import {
  FIGHT_RESULT_NONE,
  stageFighterId,
  stageFighterName,
  type StageFight,
} from '../schemas/stage.schema';

export const FIGHT_RESULT_F1_WIN = 'F1_WIN';
export const FIGHT_RESULT_F2_WIN = 'F2_WIN';
export const FIGHT_RESULT_DRAW   = 'DRAW';

/** Per-fighter aggregate over a set of bouts, keyed by user id. */
export interface FighterTally {
  id:           string;
  name:         string;
  fights:       number;
  wins:         number;
  losses:       number;
  draws:        number;
  pointsEarned: number;
  pointsLost:   number;
}

/** Who met whom in one bout; `second*` is null for a SWISS empty fight (bye). */
export interface FightPairing {
  firstId:    string;
  firstName:  string;
  secondId:   string | null;
  secondName: string | null;
}

/**
 * Folds `fights` into `tallies` and returns the pairings it saw. Shared by POOL
 * round-robins and SWISS rounds: both store bouts as `stage.pools[].fights[]` with
 * populated `fighter1`/`fighter2`, so wins, losses and scored points aggregate the
 * same way. Every bout must be decided — an undecided one fails here.
 */
export function tallyFights(
  fights:  StageFight[],
  tallies: Map<string, FighterTally>,
  label:   string,
): FightPairing[] {
  return fights.map(fight => tallyFight(fight, tallies, label));
}

function tallyFight(
  fight:   StageFight,
  tallies: Map<string, FighterTally>,
  label:   string,
): FightPairing {
  const firstId    = stageFighterId(fight.fighter1);
  const firstName  = stageFighterName(fight.fighter1);
  const secondId   = stageFighterId(fight.fighter2);
  const secondName = stageFighterName(fight.fighter2);

  expect(fight.result, `${label}: every fight must be decided`).not.toBe(FIGHT_RESULT_NONE);
  expect(firstId, `${label}: first fighter must be populated`).not.toBeNull();
  expect(firstName, `${label}: first fighter must carry a name`).not.toBeNull();

  const firstScores  = fight.fighter1?.scores ?? 0;
  const secondScores = fight.fighter2?.scores ?? 0;

  const home = tallyFor(tallies, firstId!, firstName!);

  // Empty fight on an odd roster: the backend credits the lone fighter a win.
  if (secondId === null) {
    expect(
      fight.result,
      `${label}: empty fight must be auto-won by the unpaired fighter`,
    ).toBe(FIGHT_RESULT_F1_WIN);

    home.fights       += 1;
    home.wins         += 1;
    home.pointsEarned += firstScores;

    return { firstId: firstId!, firstName: firstName!, secondId: null, secondName: null };
  }

  expect(secondName, `${label}: second fighter must carry a name`).not.toBeNull();

  const away = tallyFor(tallies, secondId, secondName!);

  home.fights += 1;
  away.fights += 1;
  home.pointsEarned += firstScores;
  home.pointsLost   += secondScores;
  away.pointsEarned += secondScores;
  away.pointsLost   += firstScores;

  if (fight.result === FIGHT_RESULT_F1_WIN) {
    home.wins   += 1;
    away.losses += 1;
  } else if (fight.result === FIGHT_RESULT_F2_WIN) {
    away.wins   += 1;
    home.losses += 1;
  } else {
    expect(fight.result, `${label}: unexpected fight result`).toBe(FIGHT_RESULT_DRAW);
    home.draws += 1;
    away.draws += 1;
  }

  return { firstId: firstId!, firstName: firstName!, secondId, secondName };
}

function tallyFor(
  tallies: Map<string, FighterTally>,
  id:      string,
  name:    string,
): FighterTally {
  const existing = tallies.get(id);
  if (existing) return existing;

  const fresh: FighterTally = {
    id, name, fights: 0, wins: 0, losses: 0, draws: 0, pointsEarned: 0, pointsLost: 0,
  };
  tallies.set(id, fresh);
  return fresh;
}

/** Coefficient as the product shows it: scored points minus points conceded. */
export function tallyCoef(tally: FighterTally): number {
  return tally.pointsEarned - tally.pointsLost;
}

/**
 * Standings rank fighters on match points (= wins) first, then coefficient.
 * `true` when `left` is strictly better and must therefore be ranked higher.
 */
export function outranks(left: FighterTally, right: FighterTally): boolean {
  if (left.wins !== right.wins) return left.wins > right.wins;
  return tallyCoef(left) > tallyCoef(right);
}
