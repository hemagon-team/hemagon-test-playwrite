import { expect, type Locator, type Page } from '@playwright/test';
import { TIMEOUTS } from '../../../data/config';
import { nominationStagesSelectors } from '../../selectors';
import { StageCardSection } from './card/StageCardSection';

/** Saved stage cards and the "+ Add stage" entry point. */
export class NominationStagesCardsSection {
  private readonly addStageButton: Locator;

  constructor(private readonly page: Page) {
    this.addStageButton = page.locator(nominationStagesSelectors.addStageButton);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.addStageButton).toBeVisible({ timeout: TIMEOUTS.long });
  }

  async openAddForm(): Promise<void> {
    await this.addStageButton.click();
  }

  cardAt(index: number): StageCardSection {
    return new StageCardSection(this.page, index);
  }

  async last(): Promise<StageCardSection> {
    const count = await this.count();
    return this.cardAt(count - 1);
  }

  async count(): Promise<number> {
    return this.page.locator(nominationStagesSelectors.allStageRemoveButtons).count();
  }

  async expectCount(count: number): Promise<void> {
    await expect(this.page.locator(nominationStagesSelectors.allStageRemoveButtons))
      .toHaveCount(count, { timeout: TIMEOUTS.long });
  }
}
