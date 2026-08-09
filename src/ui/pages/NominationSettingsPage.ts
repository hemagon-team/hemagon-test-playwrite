import { expect, type Page } from '@playwright/test';
import { TIMEOUTS } from '../../data/config';
import { endpoints } from '../../data/endpoints';
import { submitAndCapture } from '../../helpers/uiCapture';
import { NominationApiResponseSchema, type NominationApiResponse } from '../../schemas/nomination.schema';
import {
  NominationSettingsFormSection,
  type NominationSettingsFormData,
  buildNominationSettingsFormData,
} from '../components/NominationSettingsFormSection';

export { buildNominationSettingsFormData };
export type { NominationSettingsFormData };

export class NominationSettingsPage {
  readonly form: NominationSettingsFormSection;

  constructor(private readonly page: Page) {
    this.form = new NominationSettingsFormSection(page);
  }

  async openNew(tournamentId: string): Promise<void> {
    await this.page.goto(`/organizer/tournaments/${tournamentId}/nominations/new/settings`);
    await this.expectLoaded();
  }

  async openEdit(tournamentId: string, nominationId: string): Promise<void> {
    await this.page.goto(
      `/organizer/tournaments/${tournamentId}/nominations/${nominationId}/settings`,
    );
    await this.expectEditLoaded();
  }

  async expectLoaded(): Promise<void> {
    await this.page.waitForURL(
      /\/organizer\/tournaments\/[a-f0-9]+\/nominations\/new\/settings(?:$|\?)/,
      { timeout: TIMEOUTS.long },
    );
    await this.form.expectLoaded();
  }

  async expectEditLoaded(): Promise<void> {
    await this.page.waitForURL(
      /\/organizer\/tournaments\/[a-f0-9]+\/nominations\/[a-f0-9]+\/settings(?:$|\?)/,
      { timeout: TIMEOUTS.long },
    );
    await this.form.expectLoaded();
  }

  async createCategory(data: NominationSettingsFormData): Promise<NominationApiResponse> {
    await this.form.fill(data);

    const nomination = await submitAndCapture(
      this.page,
      endpoints.nominations.base,
      () => this.form.submit(),
      NominationApiResponseSchema,
    );

    await expect(this.page).toHaveURL(
      new RegExp(`/organizer/tournaments/[a-f0-9]+/nominations/${nomination._id}(?:/|$)`),
      { timeout: TIMEOUTS.long },
    );

    return nomination;
  }

  async expectCategorySettings(data: NominationSettingsFormData): Promise<void> {
    await this.form.expectValues(data);
  }
}
