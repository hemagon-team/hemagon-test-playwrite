import { test, expect } from '../../../src/fixtures/test';
import { autotestLabel } from '../../../src/helpers/randomCode';
import { TOURNAMENT_PURPOSE_IS_TESTING } from '../../../src/data/tournamentData';
import { DEFAULT_RING_TITLE } from '../../../src/data/ringData';

test.describe('Ring API', () => {
  test('creates ring for tournament via API', async ({ api, resources }) => {
    const tournament = await api.tournaments.create({ title: autotestLabel('AUTOTEST API Ring') });
    expect(tournament.test).toBe(TOURNAMENT_PURPOSE_IS_TESTING);
    resources.tournament(tournament._id);

    const ring  = await api.rings.create(tournament._id, DEFAULT_RING_TITLE);
    const rings = await api.rings.list(tournament._id);

    expect(ring.title).toBe(DEFAULT_RING_TITLE);
    expect(ring.tournament).toBe(tournament._id);
    expect(rings.map(item => item._id)).toContain(ring._id);
    expect(rings.map(item => item.title)).toContain(DEFAULT_RING_TITLE);
  });
});
