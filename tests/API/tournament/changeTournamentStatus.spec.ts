import { test, expect } from '../../../src/fixtures/test';
import { autotestLabel } from '../../../src/helpers/randomCode';
import { TournamentStatusCode } from '../../../src/data/tournamentStatus';
import { tournamentApiResponseWithStateSchema } from '../../../src/schemas/tournament.schema';

test.describe('Tournament API', () => {
  test('changes tournament status via PUT', async ({ api, resources }) => {
    const tournament = await api.tournaments.create({
      title: autotestLabel('AUTOTEST API Status'),
    });
    resources.tournament(tournament._id);

    expect(tournament.state).toBe(TournamentStatusCode.Hidden);

    const updated = await api.tournaments.setState(tournament._id, TournamentStatusCode.Upcoming);

    expect(updated._id).toBe(tournament._id);
    expect(updated.state).toBe(TournamentStatusCode.Upcoming);

    const stored = await api.tournaments.get(tournament._id);
    tournamentApiResponseWithStateSchema(TournamentStatusCode.Upcoming).parse(stored);
  });
});
