import { test, expect } from '../../../src/fixtures/test';
import { autotestLabel } from '../../../src/helpers/randomCode';
import { TOURNAMENT_PURPOSE_IS_TESTING } from '../../../src/data/tournamentData';
import { NominationParticipantsPage } from '../../../src/ui/pages/NominationParticipantsPage';

test.describe('Nomination participants', () => {
  test.describe.configure({ timeout: 60_000 });

  test('organizer enrolls participants, removes last, confirms presence for first', async ({
    page,
    api,
    resources,
  }) => {
    const tournament = await api.tournaments.create({ title: autotestLabel('AUTOTEST Participants') });
    expect(tournament.test).toBe(TOURNAMENT_PURPOSE_IS_TESTING);
    resources.tournament(tournament._id);

    const nomination = await api.nominations.create(tournament._id);
    resources.nomination(nomination._id);

    const participantsPage = new NominationParticipantsPage(page);
    await participantsPage.open(tournament._id, nomination._id);

    const { participants } = participantsPage;
    await participants.enrollTestUsers(4);
    await participants.removeLastParticipant();
    await participants.confirmPresenceAt(0);

    await participants.expectParticipantCount(3);
    await participants.expectPresenceConfirmedAt(0);
    await participants.expectPresenceNotConfirmedAt(1);
    await participants.expectPresenceNotConfirmedAt(2);
  });
});
