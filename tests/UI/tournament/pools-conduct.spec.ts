import { test, expect } from '../../../src/fixtures/test';
import { TOURNAMENT_PURPOSE_IS_TESTING } from '../../../src/data/tournamentData';
import { autotestLabel } from '../../../src/helpers/randomCode';
import { NominationStagesPage } from '../../../src/ui/pages/NominationStagesPage';

import {
  enrollmentForPools,
  POOL_FIGHTERS_MAX,
  POOL_FIGHTERS_MIN,
  roundRobinFights,
} from '../../../src/data/poolData';

test.describe('Pool conduct', () => {
  test.describe.configure({ timeout: 240_000 });

  test('conducted pools show results on organizer cards and public bracket', async ({
    page,
    api,
    resources,
  }) => {
    const POOL_COUNT        = 4;
    const FIGHTERS_PER_POOL = 6;
    const ENROLLED          = enrollmentForPools(POOL_COUNT, FIGHTERS_PER_POOL);
    const ADVANCING         = 8;
    const BOUTS_PER_POOL    = roundRobinFights(FIGHTERS_PER_POOL);

    const tournament = await api.tournaments.create({ title: autotestLabel('AUTOTEST Pool Conduct') });
    expect(tournament.test).toBe(TOURNAMENT_PURPOSE_IS_TESTING);
    resources.tournament(tournament._id);

    const nomination = await api.nominations.create(tournament._id);
    resources.nomination(nomination._id);

    await api.enrollTestUsers(ENROLLED, { nominationId: nomination._id });

    const stagesPage = new NominationStagesPage(page);
    await stagesPage.open(tournament._id, nomination._id);

    const pools = await stagesPage.add.pool({ fightTime: 120 });
    await stagesPage.add.elimination({ fightTime: 120 });
    await pools.goesNextStage(ADVANCING, { minFromPool: 'any' });

    await pools.pools.addPools(POOL_COUNT);
    await pools.pools.seedRandomly();
    await pools.settings.expectUsersCount(ENROLLED);
    await pools.rounds.expectAllPoolsFightersInRange(POOL_FIGHTERS_MIN, POOL_FIGHTERS_MAX);

    const reopenStages = () => stagesPage.open(tournament._id, nomination._id);

    // Conduct pools 1 and 2 via UI (RUN → RND results → confirm → PUT fights).
    await pools.rounds.roundAt(0).conductAndReturn(reopenStages, {
      minFightUpdates: BOUTS_PER_POOL,
    });
    await pools.rounds.roundAt(1).conductAndReturn(reopenStages, {
      minFightUpdates: BOUTS_PER_POOL,
    });

    // Pools 3 and 4 stay pending on the organizer view.
    await pools.rounds.roundAt(2).expectLoaded();
    await pools.rounds.roundAt(3).expectLoaded();

    // Public bracket: conducted pools have Fights > 0, pending pools still at zero.
    const publicPage = await stagesPage.goToPublicPage();
    await publicPage.pool('Pool 1').expectHasPlayedResults();
    await publicPage.pool('Pool 2').expectHasPlayedResults();
    await publicPage.pool('Pool 3').expectNoResultsYet();
    await publicPage.pool('Pool 4').expectNoResultsYet();
  });
});
