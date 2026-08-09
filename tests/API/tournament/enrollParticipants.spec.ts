import { test, expect } from '../../../src/fixtures/test';
import { autotestLabel } from '../../../src/helpers/randomCode';
import { TOURNAMENT_PURPOSE_IS_TESTING } from '../../../src/data/tournamentData';

test.describe('Participant enroll API', () => {
  test('registers pool users on a nomination with default paid/presence', async ({
    api,
    resources,
  }) => {
    const tournament = await api.tournaments.create({ title: autotestLabel('AUTOTEST API Enroll') });
    expect(tournament.test).toBe(TOURNAMENT_PURPOSE_IS_TESTING);
    resources.tournament(tournament._id);

    const nomination = await api.nominations.create(tournament._id);
    resources.nomination(nomination._id);

    const enrolled = await api.enrollTestUsers(5, { nominationId: nomination._id });

    expect(enrolled).toHaveLength(5);
    expect(enrolled.every(item => item.paid === false)).toBe(true);
    expect(enrolled.every(item => item.presence === false)).toBe(true);
    expect(enrolled.every(item => /^[a-f0-9]+$/.test(item.requestId))).toBe(true);
    expect(enrolled.every(item => /^[a-f0-9]+$/.test(item.userId))).toBe(true);
  });
});
