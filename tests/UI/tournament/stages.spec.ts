import { test, expect } from '../../../src/fixtures/test';
import { TOURNAMENT_PURPOSE_IS_TESTING } from '../../../src/data/tournamentData';
import {
  enrollmentForPools,
  POOL_FIGHTERS_MAX,
  POOL_FIGHTERS_MIN,
} from '../../../src/data/poolData';
import { autotestLabel } from '../../../src/helpers/randomCode';
import { NominationStagesPage } from '../../../src/ui/pages/NominationStagesPage';

const PARTICIPANT_COUNT = 16;

test.describe('Nomination stages', () => {
  test.describe.configure({ timeout: 120_000 });

  test('organizer adds Swiss stage and enrolls all participants', async ({
    page,
    api,
    resources,
  }) => {
    const tournament = await api.tournaments.create({ title: autotestLabel('AUTOTEST Stages') });
    expect(tournament.test).toBe(TOURNAMENT_PURPOSE_IS_TESTING);
    resources.tournament(tournament._id);

    const nomination = await api.nominations.create(tournament._id);
    resources.nomination(nomination._id);

    await api.enrollTestUsers(PARTICIPANT_COUNT, { nominationId: nomination._id });

    const stagesPage = new NominationStagesPage(page);
    await stagesPage.open(tournament._id, nomination._id);

    const stage = await stagesPage.add.swiss({ fightTime: 120, tillFinals: 'yes' });
    await stage.expectTitle('Stage 1. Swiss system');
    await stage.participants.expectLoaded();
    await stage.participants.expectParticipantCount(PARTICIPANT_COUNT);

    await stage.enrollAll();

    await stage.settings.expectUsersCount(PARTICIPANT_COUNT);
    await stage.rounds.roundAt(0).expectUsersCount(PARTICIPANT_COUNT);
    await stage.rounds.roundAt(0).expectFightCount(PARTICIPANT_COUNT / 2);
    await stage.participants.expectParticipantCount(0);
  });

  test('organizer builds Pools → Elimination bracket and seeds pools', async ({
    page,
    api,
    resources,
  }) => {
    const ENROLLED   = enrollmentForPools(4, 6);
    const POOL_COUNT = 4;
    const ADVANCING  = 16;

    const tournament = await api.tournaments.create({ title: autotestLabel('AUTOTEST Pools Bracket') });
    expect(tournament.test).toBe(TOURNAMENT_PURPOSE_IS_TESTING);
    resources.tournament(tournament._id);

    const nomination = await api.nominations.create(tournament._id);
    resources.nomination(nomination._id);

    await api.enrollTestUsers(ENROLLED, { nominationId: nomination._id });

    const stagesPage = new NominationStagesPage(page);
    await stagesPage.open(tournament._id, nomination._id);

    // Stage 1 — pools. It is created "to finals"; adding stage 2 flips it to "not to finals".
    const pools = await stagesPage.add.pool({ fightTime: 120 });
    await pools.expectTitle(/Stage 1\. Pools/);

    // Stage 2 — elimination "to finals". Adding it flips stage 1 to "not to finals".
    const elimination = await stagesPage.add.elimination({ fightTime: 120 });
    await elimination.expectTitle(/Stage 2\. Elimination/);

    // How many fighters advance from the pools (semi-automatic "Goes next stage" field,
    // available only now that stage 2 exists).
    await pools.goesNextStage(ADVANCING, { minFromPool: 'any' });

    // Create 4 pools (6 fighters each — standard 4–6 per pool) and seed.
    await pools.pools.addPools(POOL_COUNT);
    await pools.rounds.expectCount(POOL_COUNT);
    await pools.pools.seedRandomly();

    // Both stages are visible and stage 1 has all fighters spread across the pools
    // (nothing left in the participants panel; each pool holds 4–6 fighters).
    await stagesPage.stages.expectCount(2);
    await pools.settings.expectUsersCount(ENROLLED);
    await pools.rounds.expectAllPoolsFightersInRange(POOL_FIGHTERS_MIN, POOL_FIGHTERS_MAX);
    await pools.participants.expectParticipantCount(0);
  });
});
