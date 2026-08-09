import { expect, type Page } from '@playwright/test';
import { TIMEOUTS } from '../../data/config';
import { endpoints } from '../../data/endpoints';
import { submitAndCapture } from '../../helpers/uiCapture';
import {
  TournamentSettingsFormSection,
  type TournamentSettingsFormData,
  buildTournamentSettingsFormData,
} from '../components/TournamentSettingsFormSection';

export { buildTournamentSettingsFormData };
export type { TournamentSettingsFormData };
import {
  TournamentCreatedApiResponseSchema,
  type TournamentCreatedApiResponse,
} from '../../schemas/tournament.schema';

export class TournamentSettingsPage {
  readonly form: TournamentSettingsFormSection;

  constructor(private readonly page: Page) {
    this.form = new TournamentSettingsFormSection(page);
  }

  async openNew(): Promise<void> {
    await this.page.goto('/organizer/tournaments/new/settings');
    await this.expectLoaded();
  }

  async open(tournamentId: string): Promise<void> {
    await this.page.goto(`/organizer/tournaments/${tournamentId}/settings`);
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await this.page.waitForURL(/\/organizer\/tournaments\/(?:new|[a-f0-9]+)\/settings(?:$|\?)/, {
      timeout: TIMEOUTS.long,
    });
    await this.form.expectLoaded();
  }

  async createTournament(data: TournamentSettingsFormData): Promise<TournamentCreatedApiResponse> {
    await this.form.fill(data);

    const tournament = await submitAndCapture(
      this.page,
      endpoints.tournaments.base,
      () => this.form.submit(),
      TournamentCreatedApiResponseSchema,
    );

    await expect(this.page).toHaveURL(new RegExp(`/organizer/tournaments/${tournament._id}(?:$|/)`), {
      timeout: TIMEOUTS.long,
    });

    return tournament;
  }

  async expectTournamentSettings(data: TournamentSettingsFormData): Promise<void> {
    await this.form.expectValues(data);
  }
}
