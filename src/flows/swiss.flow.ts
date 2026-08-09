import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { StageType } from '../data/nominationStageData';
import {
  SWISS_EMPTY_FIGHT_RESULT,
  SWISS_EMPTY_FIGHT_SCORE,
  swissFightsPerRound,
  swissHasEmptyFight,
  swissRealBoutsPerRound,
  swissRecommendedRounds,
} from '../data/swissData';
import { TOURNAMENT_PURPOSE_IS_TESTING } from '../data/tournamentData';
import type { ResourceTracker } from '../fixtures/resourceTracker';
import type { TestApi } from '../fixtures/test';
import { autotestLabel } from '../helpers/randomCode';
import type { SwissScenario } from '../schemas/swissScenario.schema';
import type { StageCardSection } from '../ui/components/stages/card/StageCardSection';
import { NominationStagesPage } from '../ui/pages/NominationStagesPage';
import {
  assertStandingsMatchExpected,
  assertStandingsOrdering,
  assertStandingsParity,
  assertSwissStageCompleted,
} from '../validation/swiss.validator';

export interface SwissFlowContext {
  page:      Page;
  api:       TestApi;
  resources: ResourceTracker;
  scenario:  SwissScenario;
}

/**
 * Declarative Swiss system lifecycle driven by {@link SwissScenario}: enroll the
 * roster, then conduct round after round, each time appending the next pairing from
 * current standings. Final standings are recomputed from the API fight documents and
 * must match all three views — the organizer rating panel, the public Rating tab,
 * and public Final standings.
 */
export async function runSwissScenario(ctx: SwissFlowContext): Promise<void> {
  const { page, api, resources, scenario } = ctx;
  const { participantsNumber, rounds, stageFightTime } = scenario;

  const tournament = await api.tournaments.create({
    title: autotestLabel(`AUTOTEST ${scenario.id}`),
  });
  expect(tournament.test).toBe(TOURNAMENT_PURPOSE_IS_TESTING);
  resources.tournament(tournament._id);

  const nomination = await api.nominations.create(tournament._id);
  resources.nomination(nomination._id);

  await api.enrollTestUsers(participantsNumber, { nominationId: nomination._id });

  const stagesPage   = new NominationStagesPage(page);
  const reopenStages = () => stagesPage.open(tournament._id, nomination._id);
  await reopenStages();

  const stage = await stagesPage.add.swiss({
    fightTime:  stageFightTime,
    tillFinals: 'yes',
  });
  await stage.expectTitle('Stage 1. Swiss system');
  await stage.participants.expectParticipantCount(participantsNumber);

  await stage.enrollAll();

  // "Users" aggregates roster entries per conducted round, so it only equals the
  // roster before further rounds are built.
  await stage.settings.expectUsersCount(participantsNumber);
  await stage.settings.expectRecommendedRounds(swissRecommendedRounds(participantsNumber));
  await stage.participants.expectParticipantCount(0);

  if (swissHasEmptyFight(participantsNumber)) {
    await stage.settings.expectEmptyFightResult(
      SWISS_EMPTY_FIGHT_RESULT,
      SWISS_EMPTY_FIGHT_SCORE,
    );
  }

  await conductAllRounds(stagesPage, stage, scenario, reopenStages);
  await stage.rounds.expectCount(rounds);

  const stageApi = await api.stages.getByType(nomination._id, StageType.Swiss);
  const expected = assertSwissStageCompleted(stageApi, scenario);

  const organizerRows = await (await stage.rating.open()).rows();
  assertStandingsMatchExpected(organizerRows, expected, 'organizer rating');
  assertStandingsOrdering(organizerRows, 'organizer rating');
  await stage.rating.close();

  const publicPage = await stagesPage.goToPublicPage();
  await publicPage.swiss().expectRoundCount(rounds);

  const publicRatingRows = await (await publicPage.swiss().openRating()).rows();
  assertStandingsMatchExpected(publicRatingRows, expected, 'public rating');
  assertStandingsOrdering(publicRatingRows, 'public rating');
  assertStandingsParity(organizerRows, publicRatingRows, 'organizer rating', 'public rating');

  const finalStandingsRows = await (await publicPage.openFinalStandings()).rows();
  assertStandingsMatchExpected(finalStandingsRows, expected, 'public final standings');
  assertStandingsOrdering(finalStandingsRows, 'public final standings');
  assertStandingsParity(
    organizerRows,
    finalStandingsRows,
    'organizer rating',
    'public final standings',
  );
}

/**
 * Conducts every round through its pool conduct page (RUN → RND results) and builds
 * the next pairing in between. The public bracket is visited once, after round one,
 * to prove results are published; the standings parity checks cover the rest.
 *
 * Only the current round is conducted per iteration — the stage-level "RND results"
 * button would refill every earlier round too, rewriting results the later pairings
 * were derived from.
 */
async function conductAllRounds(
  stagesPage: NominationStagesPage,
  stage: StageCardSection,
  scenario: SwissScenario,
  reopenStages: () => Promise<void>,
): Promise<void> {
  const { participantsNumber, rounds } = scenario;

  const fightsPerRound = swissFightsPerRound(participantsNumber);
  const realBouts      = swissRealBoutsPerRound(participantsNumber);

  for (let index = 0; index < rounds; index++) {
    const round = stage.rounds.roundAt(index);

    await round.expectUsersCount(participantsNumber);
    await round.expectFightCount(fightsPerRound);
    await round.conductAndReturn(reopenStages, { minFightUpdates: realBouts });

    if (index === 0) {
      const publicPage = await stagesPage.goToPublicPage();
      await publicPage.swiss().expectRoundCount(1);
      await reopenStages();
    }

    if (index < rounds - 1) {
      await stage.buildNextSwissRound();
    }
  }
}
