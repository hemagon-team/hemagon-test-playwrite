import { expect, type Page } from '@playwright/test';
import { TIMEOUTS } from '../../data/config';
import { POOL_RND_RESULTS_TIMEOUT_MS } from '../../data/poolData';
import { nominationPoolSelectors } from '../selectors';

/**
 * Organizer pool conduct route: `/organizer/tournaments/:tid/nominations/:nid/pools/:poolId`.
 */
export class NominationPoolPage {
  constructor(private readonly page: Page) {}

  async expectLoaded(): Promise<void> {
    await this.page.waitForURL(
      /\/organizer\/tournaments\/[a-f0-9]+\/nominations\/[a-f0-9]+\/pools\/[a-f0-9]+(?:$|\?)/,
      { timeout: TIMEOUTS.long },
    );
    await expect(this.page.locator(nominationPoolSelectors.rndResultsButton))
      .toBeVisible({ timeout: TIMEOUTS.short });
  }

  /** Per-bout "Run" buttons on the conduct page (one per scheduled fight). */
  private boutRunButtons() {
    return this.page.getByRole('button', { name: 'Run' });
  }

  async boutCount(): Promise<number> {
    return this.boutRunButtons().count();
  }

  /**
   * Fills every bout with random scores via "RND results" (native confirm dialog)
   * and waits until bout rows switch to the post-result state (Edit visible).
   */
  async fillRandomResults(): Promise<number> {
    const rndButton = this.page.locator(nominationPoolSelectors.rndResultsButton);
    await expect(rndButton).toBeEnabled({ timeout: TIMEOUTS.short });

    const expectedBouts = await this.boutRunButtons().count();
    expect(expectedBouts).toBeGreaterThan(0);

    await Promise.all([
      this.page.waitForEvent('dialog').then(d => d.accept()),
      rndButton.click(),
    ]);

    await expect(this.page.getByRole('button', { name: 'Edit' }).first())
      .toBeVisible({ timeout: POOL_RND_RESULTS_TIMEOUT_MS });

    return expectedBouts;
  }
}
