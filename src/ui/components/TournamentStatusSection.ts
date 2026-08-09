import { expect, type Locator, type Page } from '@playwright/test';
import { TIMEOUTS } from '../../data/config';
import { endpoints } from '../../data/endpoints';
import { DEFAULT_TOURNAMENT_STATUS, TournamentStatusCode } from '../../data/tournamentStatus';
import type { TournamentStatusCode as StatusCode } from '../../data/tournamentStatus';
import { tournamentStatusSelectors } from '../selectors';

export class TournamentStatusSection {
  constructor(private readonly page: Page) {}

  private statusButton(code: StatusCode): Locator {
    return this.page.locator(tournamentStatusSelectors.button(code));
  }

  async expectLoaded(): Promise<void> {
    await expect(this.statusButton(TournamentStatusCode.Hidden)).toBeVisible({
      timeout: TIMEOUTS.long,
    });
  }

  /** Asserts the given status chip is selected (`.active`). */
  async expectActive(code: StatusCode): Promise<void> {
    await expect(this.page.locator(tournamentStatusSelectors.activeButton(code))).toBeVisible({
      timeout: TIMEOUTS.short,
    });
  }

  /** New tournaments default to Hidden (`DEVELOPING`). */
  async expectDefaultAfterCreate(): Promise<void> {
    await this.expectActive(DEFAULT_TOURNAMENT_STATUS);
  }

  async selectStatus(code: StatusCode, tournamentId?: string): Promise<void> {
    const click = () => this.statusButton(code).click();

    if (tournamentId) {
      const urlPart = endpoints.tournaments.byId(tournamentId);
      await Promise.all([
        this.page.waitForResponse(
          res => res.url().includes(urlPart) && res.request().method() === 'PUT' && res.ok(),
          { timeout: TIMEOUTS.long },
        ),
        click(),
      ]);
    } else {
      await click();
    }

    await this.expectActive(code);
  }
}
