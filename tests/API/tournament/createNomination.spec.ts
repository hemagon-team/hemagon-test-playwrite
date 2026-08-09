import { test, expect } from '../../../src/fixtures/test';
import { autotestLabel } from '../../../src/helpers/randomCode';
import { NOMINATION_WEAPON_KATANA_ID, toNominationSlug } from '../../../src/data/nominationData';
import { TOURNAMENT_PURPOSE_IS_TESTING } from '../../../src/data/tournamentData';

test.describe('Nomination API', () => {
  test('creates category for tournament via API', async ({ api, resources }) => {
    const tournament = await api.tournaments.create({ title: autotestLabel('AUTOTEST API Category') });
    expect(tournament.test).toBe(TOURNAMENT_PURPOSE_IS_TESTING);
    resources.tournament(tournament._id);

    const title      = autotestLabel('AUTOTEST API Nomination');
    const nomination = await api.nominations.create(tournament._id, {
      title,
      twoThirdsPlace: true,
    });
    resources.nomination(nomination._id);

    const stored = await api.nominations.get(nomination._id);

    expect(nomination.title).toBe(title);
    expect(nomination.idString).toBe(toNominationSlug(title));
    expect(nomination.isTeam).toBe(false);
    expect(nomination.twoThirdsPlace).toBe(true);
    expect(nomination.isFightingNomination).toBe(true);

    expect(stored._id).toBe(nomination._id);
    expect(stored.title).toBe(title);
    expect(stored.isTeam).toBe(false);
    expect(stored.twoThirdsPlace).toBe(true);
    expect(stored.isFightingNomination).toBe(true);

    const weaponId = typeof stored.weapon === 'string'
      ? stored.weapon
      : (stored.weapon as { _id?: string })?._id;

    expect(weaponId).toBe(NOMINATION_WEAPON_KATANA_ID);

    const tournamentId = typeof stored.tournament === 'string'
      ? stored.tournament
      : (stored.tournament as { _id: string })._id;

    expect(tournamentId).toBe(tournament._id);
  });
});
