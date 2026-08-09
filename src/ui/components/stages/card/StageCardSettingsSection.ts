import { expect, type Locator } from '@playwright/test';
import { TIMEOUTS } from '../../../../data/config';
import { nominationStagesSelectors } from '../../../selectors';

export class StageCardSettingsSection {
  private readonly settings: Locator;

  constructor(card: Locator) {
    this.settings = card.locator(nominationStagesSelectors.stageSettings);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.settings).toBeVisible({ timeout: TIMEOUTS.short });
  }

  /**
   * SWISS caveat: this counter aggregates roster entries across conducted rounds,
   * so it only equals the participant count before extra rounds are built.
   */
  async expectUsersCount(count: number): Promise<void> {
    const row = this.settings.locator('label', { hasText: 'Users' }).locator('..');
    await expect(row.locator('span')).toHaveText(String(count), { timeout: TIMEOUTS.short });
  }

  /** SWISS — "Recommended rounds" readout, the product's ceil(log2(N)) + 2. */
  async expectRecommendedRounds(rounds: number): Promise<void> {
    const row = this.settings
      .locator('label', { hasText: 'Recommended rounds' })
      .locator('..');
    await expect(row).toContainText(String(rounds), { timeout: TIMEOUTS.short });
  }

  /** SWISS — auto-result granted to the unpaired fighter on an odd roster. */
  async expectEmptyFightResult(result: string, score: number): Promise<void> {
    const row = this.settings
      .locator('label', { hasText: 'Empty fight result' })
      .locator('..');
    await expect(row).toContainText(result, { timeout: TIMEOUTS.short });
    await expect(row).toContainText(String(score), { timeout: TIMEOUTS.short });
  }

  /** "Goes next stage" appears once a later stage exists (the stage is no longer the final). */
  async expectGoesNextStage(count: number): Promise<void> {
    const row = this.settings.locator('label', { hasText: 'Goes next stage' }).locator('..');
    await expect(row).toContainText(String(count), { timeout: TIMEOUTS.short });
  }
}
