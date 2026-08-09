import { test, expect } from '../../../src/fixtures/test';
import { TOURNAMENT_PURPOSE_IS_TESTING } from '../../../src/data/tournamentData';
import { autotestLabel } from '../../../src/helpers/randomCode';
import { TournamentStatusCode } from '../../../src/data/tournamentStatus';
import { TournamentOverviewPage } from '../../../src/ui/pages/TournamentOverviewPage';

test.describe('Tournament overview page', () => {
  test('organizer changes status to Upcoming and it persists after reload', async ({ page, api, resources }) => {
    const tournament = await api.tournaments.create({ title: autotestLabel('AUTOTEST UI Status') });
    expect(tournament.test).toBe(TOURNAMENT_PURPOSE_IS_TESTING);
    resources.tournament(tournament._id);

    const overviewPage = new TournamentOverviewPage(page);
    await overviewPage.open(tournament._id);
    await overviewPage.status.expectDefaultAfterCreate();

    await overviewPage.status.selectStatus(TournamentStatusCode.Upcoming, tournament._id);

    await overviewPage.reload();
    await overviewPage.status.expectActive(TournamentStatusCode.Upcoming);
  });
});
