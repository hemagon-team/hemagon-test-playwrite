import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import {
  eliminationRoundFightCount,
  totalEliminationScoredBouts,
  type ScenarioAdvanceCount,
} from '../data/scenarioData';
import { eliminationFinalsFights, eliminationFinalsRound, POOL_FIGHTERS_MAX, POOL_FIGHTERS_MIN } from '../data/poolData';
import { StageType } from '../data/nominationStageData';
import { TOURNAMENT_PURPOSE_IS_TESTING } from '../data/tournamentData';
import type { TestApi } from '../fixtures/test';
import type { ResourceTracker } from '../fixtures/resourceTracker';
import { autotestLabel } from '../helpers/randomCode';
import type { PoolsEliminationScenario } from '../schemas/poolsEliminationScenario.schema';
import type { StageCardSection } from '../ui/components/stages/card/StageCardSection';
import { NominationPublicPage } from '../ui/pages/NominationPublicPage';
import { NominationStagesPage } from '../ui/pages/NominationStagesPage';
import {
  assertAdvancedFightersOutrankTheRest,
  assertBracketEntrants,
  assertEliminationCompleted,
} from '../validation/elimination.validator';

export interface PoolsEliminationFlowContext {
  page:      Page;
  api:       TestApi;
  resources: ResourceTracker;
  scenario:  PoolsEliminationScenario;
}

/**
 * Declarative Pools → Elimination lifecycle driven by {@link PoolsEliminationScenario}.
 */
export async function runPoolsEliminationScenario(
  ctx: PoolsEliminationFlowContext,
): Promise<void> {
  const { page, api, resources, scenario } = ctx;
  const {
    participantsNumber,
    poolsCount,
    advanceCount,
    minimumFromEachPool,
    stageFightTime,
    thirdPlace,
  } = scenario;

  const tournament = await api.tournaments.create({
    title: autotestLabel(`AUTOTEST ${scenario.id}`),
  });
  expect(tournament.test).toBe(TOURNAMENT_PURPOSE_IS_TESTING);
  resources.tournament(tournament._id);

  const nomination = await api.nominations.create(tournament._id);
  resources.nomination(nomination._id);

  await api.enrollTestUsers(participantsNumber, { nominationId: nomination._id });

  const stagesPage = new NominationStagesPage(page);
  await stagesPage.open(tournament._id, nomination._id);

  const pools       = await stagesPage.add.pool({ fightTime: stageFightTime });
  const elimination = await stagesPage.add.elimination({ fightTime: stageFightTime, thirdPlace });

  await pools.goesNextStage(advanceCount, { minFromPool: minimumFromEachPool });

  await pools.pools.addPools(poolsCount);
  await pools.pools.seedRandomly();
  await pools.settings.expectUsersCount(participantsNumber);
  await pools.rounds.expectAllPoolsFightersInRange(POOL_FIGHTERS_MIN, POOL_FIGHTERS_MAX);

  const reopenStages = () => stagesPage.open(tournament._id, nomination._id);
  await pools.conductAllPools(reopenStages, poolsCount);

  // Conducted pool results are published on the public page.
  const poolsPublicPage = await stagesPage.goToPublicPage();
  for (let i = 1; i <= poolsCount; i++) {
    await poolsPublicPage.pool(`Pool ${i}`).expectHasPlayedResults();
  }
  await reopenStages();

  await pools.buildNextStage();

  await elimination.expectTitle(/Stage 2\. Elimination/);
  await elimination.bracket.expectLoaded();

  // API-level checks: the bracket holds the right number of fighters, honours the
  // per-pool minimum, and nobody stronger was left behind in a pool.
  const poolStageApi = await api.stages.getByType(nomination._id, StageType.Pool);
  const elimStageApi = await api.stages.getByType(nomination._id, StageType.Elimination);
  assertBracketEntrants(poolStageApi, elimStageApi, scenario);
  assertAdvancedFightersOutrankTheRest(poolStageApi, elimStageApi);
  expect(
    elimStageApi.settings?.fightForThirdPlace,
    'elimination stage fightForThirdPlace must match scenario',
  ).toBe(thirdPlace);

  const publicPage = await runEliminationBracketToFinals(
    stagesPage,
    elimination,
    advanceCount,
    thirdPlace,
    reopenStages,
  );

  // API-level check: every bracket bout is decided and the gold fight has a winner.
  const finishedElimStage = await api.stages.getByType(nomination._id, StageType.Elimination);
  const winnerName = assertEliminationCompleted(
    finishedElimStage,
    totalEliminationScoredBouts(advanceCount, thirdPlace),
    thirdPlace,
  );

  // The gold-fight winner tops the published final standings. Placements below first
  // come from bracket depth rather than raw scores, so only the podium head is fixed.
  const finalStandings = await (await publicPage.openFinalStandings()).rows();
  expect(finalStandings[0]?.rank, 'final standings must start at rank 1').toBe(1);
  expect(finalStandings[0]?.name, 'gold-fight winner must top the final standings')
    .toBe(winnerName);
}

/**
 * Conduct every elimination round through gold/bronze. Public scores are verified
 * twice — after round 1 (parser sanity) and after finals (cumulative total) — to
 * avoid a public round-trip per round.
 */
async function runEliminationBracketToFinals(
  stagesPage: NominationStagesPage,
  elimination: StageCardSection,
  advance: ScenarioAdvanceCount,
  thirdPlace: boolean,
  reopenStages: () => Promise<void>,
): Promise<NominationPublicPage> {
  const finalsRound   = eliminationFinalsRound(advance);
  const finalsFights  = eliminationFinalsFights(thirdPlace);
  const expectedTotal = totalEliminationScoredBouts(advance, thirdPlace);
  let publicPage:     NominationPublicPage;

  for (let round = 1; round < finalsRound; round++) {
    if (round > 1) {
      await elimination.buildNextSideRound(0);
      await elimination.buildNextSideRound(1);
    }

    const fights = eliminationRoundFightCount(advance, round);

    await elimination.bracket.expectRoundFightCount(round, fights);
    await elimination.fillRandomResults(round, fights);
    await elimination.bracket.expectRoundFightsHaveResults(round, fights);

    if (round === 1) {
      publicPage = await stagesPage.goToPublicPage();
      await publicPage.elimination().expectScoredBoutCount(fights);
      await reopenStages();
    }
  }

  const finals = { finals: true, thirdPlace };

  await elimination.buildFinals();
  await elimination.bracket.expectRoundTitle(finalsRound);
  await elimination.bracket.expectRoundFightCount(finalsRound, finalsFights, finals);

  if (thirdPlace) {
    await elimination.fillRandomResults(finalsRound, finalsFights, finals);
    await elimination.bracket.expectRoundFightsHaveResults(finalsRound, finalsFights, finals);
  } else {
    await elimination.conductFinalsGoldFight(finalsRound, reopenStages);
  }

  publicPage = await stagesPage.goToPublicPage();
  await publicPage.elimination().expectScoredBoutCount(expectedTotal);

  return publicPage;
}
