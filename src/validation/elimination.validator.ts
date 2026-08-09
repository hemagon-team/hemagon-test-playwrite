import { expect } from '@playwright/test';
import type { PoolsEliminationScenario } from '../schemas/poolsEliminationScenario.schema';
import {
  FIGHT_RESULT_BOTH_WIN,
  FIGHT_RESULT_NONE,
  stageFighterId,
  stageFighterName,
  stageUserId,
  type StageApiResponse,
} from '../schemas/stage.schema';
import {
  FIGHT_RESULT_F1_WIN,
  FIGHT_RESULT_F2_WIN,
  outranks,
  tallyCoef,
  tallyFights,
  type FighterTally,
} from './fightTally';

/** Finals bouts live on API side 2 (0/1 are the bracket sides). */
const FINALS_SIDE = 2;
const GOLD_FIGHT_INDEX = 0;
const DECIDED_FIGHT_RESULTS = [FIGHT_RESULT_F1_WIN, FIGHT_RESULT_F2_WIN] as const;

/** Elimination entrants = fighters seeded into API round 0 bracket bouts. */
function bracketEntrantIds(elimination: StageApiResponse): Set<string> {
  const ids = new Set<string>();

  for (const bout of elimination.pools) {
    if (bout.round !== 0 || bout.side === FINALS_SIDE) continue;
    for (const user of bout.users) ids.add(stageUserId(user));
  }
  return ids;
}

/**
 * After build-next-stage: exactly `advanceCount` fighters entered the bracket,
 * every entrant comes from a pool, and — when `minimumFromEachPool` is numeric —
 * every pool contributed at least that many fighters.
 */
export function assertBracketEntrants(
  poolStage: StageApiResponse,
  eliminationStage: StageApiResponse,
  scenario: Pick<PoolsEliminationScenario, 'advanceCount' | 'minimumFromEachPool'>,
): void {
  const entrants = bracketEntrantIds(eliminationStage);

  expect(entrants.size, 'bracket entrants must equal advanceCount').toBe(scenario.advanceCount);

  const seenInPools = new Set<string>();

  for (const pool of poolStage.pools) {
    const memberIds = pool.users.map(stageUserId);
    memberIds.forEach(id => seenInPools.add(id));

    const advanced = memberIds.filter(id => entrants.has(id)).length;

    if (scenario.minimumFromEachPool !== 'any') {
      expect(
        advanced,
        `${pool.title}: at least ${scenario.minimumFromEachPool} fighters must advance`,
      ).toBeGreaterThanOrEqual(scenario.minimumFromEachPool);
    }
  }

  for (const id of entrants) {
    expect(seenInPools.has(id), `bracket entrant ${id} must come from a pool`).toBe(true);
  }
}

/**
 * Who advanced must be the strongest of their pool. The cross-pool fill order is the
 * product's business, so this checks the property that holds regardless of it: inside
 * every pool, nobody who stayed behind may strictly outrank someone who advanced.
 * Fighters tied on both match points and coefficient may go either way.
 */
export function assertAdvancedFightersOutrankTheRest(
  poolStage: StageApiResponse,
  eliminationStage: StageApiResponse,
): void {
  const entrants = bracketEntrantIds(eliminationStage);

  for (const pool of poolStage.pools) {
    const tallies = new Map<string, FighterTally>();
    tallyFights(pool.fights, tallies, pool.title);

    const members = pool.users.map(stageUserId).map(id => {
      const tally = tallies.get(id);
      expect(tally, `${pool.title}: pool member ${id} has no recorded fights`).toBeDefined();
      return tally!;
    });

    const advanced  = members.filter(member => entrants.has(member.id));
    const stayed    = members.filter(member => !entrants.has(member.id));
    const violations: string[] = [];

    for (const promoted of advanced) {
      for (const dropped of stayed) {
        if (outranks(dropped, promoted)) {
          violations.push(`${describe(dropped)} outranks advanced ${describe(promoted)}`);
        }
      }
    }

    expect(violations.sort(), `${pool.title}: only the pool's best may advance`).toEqual([]);
  }
}

/**
 * After finals: the bracket holds exactly the expected bout count, every bout has
 * a decided result, and the gold fight yields a winner. When `thirdPlace` is false,
 * no bronze bout must exist. Returns the gold-fight winner's display name.
 */
export function assertEliminationCompleted(
  eliminationStage: StageApiResponse,
  expectedTotalBouts: number,
  thirdPlace = true,
): string {
  const bouts = eliminationStage.pools;
  let scored  = 0;

  for (const bout of bouts) {
    const result          = bout.fights[0]?.result;
    const isSkippedBronze = !thirdPlace && bout.side === FINALS_SIDE && bout.index === 1;

    if (isSkippedBronze) {
      expect(result, `${bout.title}: bronze must be auto-resolved`).toBe(FIGHT_RESULT_BOTH_WIN);
      continue;
    }

    expect(
      result,
      `${bout.title}: fight must be decided`,
    ).not.toBe(FIGHT_RESULT_NONE);
    expect(DECIDED_FIGHT_RESULTS as readonly string[]).toContain(result);
    scored++;
  }

  expect(scored, 'conducted elimination bouts').toBe(expectedTotalBouts);

  const gold = bouts.find(b => b.side === FINALS_SIDE && b.index === GOLD_FIGHT_INDEX);
  expect(gold, 'gold fight must exist').toBeDefined();

  const goldFight  = gold!.fights[0];
  const winner     = goldFight.result === FIGHT_RESULT_F1_WIN
    ? goldFight.fighter1
    : goldFight.fighter2;
  const winnerName = stageFighterName(winner);

  expect(stageFighterId(winner), 'gold fight winner must be determined').toBeTruthy();
  expect(winnerName, 'gold fight winner must carry a name').not.toBeNull();

  return winnerName!;
}

function describe(tally: FighterTally): string {
  return `${tally.name} (${tally.wins}W, coef ${tallyCoef(tally)})`;
}
