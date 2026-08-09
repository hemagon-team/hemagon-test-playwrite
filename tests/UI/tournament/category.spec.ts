import { test, expect } from '../../../src/fixtures/test';
import { autotestLabel } from '../../../src/helpers/randomCode';
import { TOURNAMENT_PURPOSE_IS_TESTING } from '../../../src/data/tournamentData';
import { buildNominationSettingsFormData } from '../../../src/ui/pages/NominationSettingsPage';
import { NominationSettingsPage } from '../../../src/ui/pages/NominationSettingsPage';
import { TournamentNominationsPage } from '../../../src/ui/pages/TournamentNominationsPage';

test.describe('Tournament nominations', () => {
  test.describe.configure({ timeout: 60_000 });

  test('organizer adds category and sees it on nominations list', async ({ page, api, resources }) => {
    const tournament = await api.tournaments.create({ title: autotestLabel('AUTOTEST Category') });
    expect(tournament.test).toBe(TOURNAMENT_PURPOSE_IS_TESTING);
    resources.tournament(tournament._id);

    const formData = buildNominationSettingsFormData({
      team:          false,
      twoThirdPlace: true,
    });

    const settingsPage = new NominationSettingsPage(page);
    await settingsPage.openNew(tournament._id);

    const nomination = await settingsPage.createCategory(formData);
    resources.nomination(nomination._id);

    await settingsPage.openEdit(tournament._id, nomination._id);
    await settingsPage.expectCategorySettings(formData);

    const nominationsPage = new TournamentNominationsPage(page);
    await nominationsPage.open(tournament._id);
    await nominationsPage.expectNominationVisible(formData.title);
  });
});
