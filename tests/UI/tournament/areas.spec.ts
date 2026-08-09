import { test, expect } from '../../../src/fixtures/test';
import { autotestLabel } from '../../../src/helpers/randomCode';
import { TOURNAMENT_PURPOSE_IS_TESTING } from '../../../src/data/tournamentData';
import { TournamentAreasPage } from '../../../src/ui/pages/TournamentAreasPage';

test.describe('Tournament areas page', () => {
  test('organizer creates two rings from areas page', async ({ page, api, resources }) => {
    const tournament = await api.tournaments.create({ title: autotestLabel('AUTOTEST Areas') });
    expect(tournament.test).toBe(TOURNAMENT_PURPOSE_IS_TESTING);
    resources.tournament(tournament._id);

    const areasPage = new TournamentAreasPage(page);
    await areasPage.open(tournament._id);

    const ring1 = await areasPage.createAndExpectRing('Ring 1');
    const ring2 = await areasPage.createAndExpectRing('Ring 2');

    const rings = await api.rings.list(tournament._id);
    expect(ring1.title).toBe('Ring 1');
    expect(ring2.title).toBe('Ring 2');
    expect(rings.map(item => item._id)).toEqual(expect.arrayContaining([ring1._id, ring2._id]));
  });
});
