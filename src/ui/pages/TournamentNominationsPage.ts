import { expect, type Page } from '@playwright/test';
import { TIMEOUTS } from '../../data/config';
import { tournamentNominationsSelectors } from '../selectors';

export class TournamentNominationsPage {
  constructor(private readonly page: Page) {}

  async open(tournamentId: string): Promise<void> {
    await this.page.goto(`/organizer/tournaments/${tournamentId}/nominations`);
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await this.page.waitForURL(/\/organizer\/tournaments\/[a-f0-9]+\/nominations(?:$|\?)/, {
      timeout: TIMEOUTS.long,
    });
    await expect(this.page.locator(tournamentNominationsSelectors.addCategoryButton))
      .toBeVisible({ timeout: TIMEOUTS.long });
    await expect(this.page.locator(tournamentNominationsSelectors.grid))
      .toBeVisible({ timeout: TIMEOUTS.short });
  }

  async expectNominationVisible(title: string): Promise<void> {
    const grid = this.page.locator(tournamentNominationsSelectors.grid);
    await expect(grid.getByText(title, { exact: true })).toBeVisible({ timeout: TIMEOUTS.short });
  }
}
