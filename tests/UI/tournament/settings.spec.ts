import { test, expect } from '../../../src/fixtures/test';
import { TOURNAMENT_PURPOSE_IS_TESTING } from '../../../src/data/tournamentData';
import {
  buildTournamentSettingsFormData,
} from '../../../src/ui/components/TournamentSettingsFormSection';
import { TournamentSettingsPage } from '../../../src/ui/pages/TournamentSettingsPage';

test.describe('Tournament settings page', () => {
  test('organizer fills all tournament fields and sees them on edit page', async ({ page, resources }) => {
    const formData     = buildTournamentSettingsFormData();
    const settingsPage = new TournamentSettingsPage(page);

    await settingsPage.openNew();
    const tournament = await settingsPage.createTournament(formData);
    expect(tournament.test).toBe(TOURNAMENT_PURPOSE_IS_TESTING);
    resources.tournament(tournament._id);

    await settingsPage.open(tournament._id);
    await settingsPage.expectTournamentSettings(formData);
  });
});
