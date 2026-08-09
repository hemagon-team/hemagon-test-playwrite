import { test, expect } from '../../../src/fixtures/test';
import { autotestLabel } from '../../../src/helpers/randomCode';
import { TOURNAMENT_PURPOSE_IS_TESTING, toTournamentSlug } from '../../../src/data/tournamentData';
import { TournamentCreatedApiResponseSchema } from '../../../src/schemas/tournament.schema';

test.describe('Tournament API', () => {
  test('creates tournament via API', async ({ api, resources }) => {
    const title      = autotestLabel('AUTOTEST API Tournament');
    const tournament = await api.tournaments.create({ title });
    resources.tournament(tournament._id);

    const stored = await api.tournaments.get(tournament._id);
    TournamentCreatedApiResponseSchema.parse(stored);

    expect(tournament.title).toBe(title);
    expect(tournament.idString).toBe(toTournamentSlug(title));
    expect(tournament.test).toBe(TOURNAMENT_PURPOSE_IS_TESTING);
    expect(stored._id).toBe(tournament._id);
    expect(stored.title).toBe(title);
    expect(stored.test).toBe(TOURNAMENT_PURPOSE_IS_TESTING);
  });
});
