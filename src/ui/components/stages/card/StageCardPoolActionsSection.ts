import { expect, type Locator } from '@playwright/test';
import { TIMEOUTS } from '../../../../data/config';
import { nominationStagesSelectors } from '../../../selectors';

/** POOL stages — create empty pools and auto-distribute participants into them. */
export class StageCardPoolActionsSection {
  private readonly addPoolButton:      Locator;
  private readonly seedRandomlyButton: Locator;
  private readonly poolCards:          Locator;

  constructor(card: Locator, index: number) {
    this.addPoolButton      = card.locator(nominationStagesSelectors.stageAddPoolButton(index));
    // Two "Seed*" buttons share the same id, so disambiguate by accessible name.
    this.seedRandomlyButton = card.getByRole('button', {
      name: nominationStagesSelectors.seedRandomlyLabel,
    });
    this.poolCards          = card.locator(nominationStagesSelectors.stageRoundCard);
  }

  /** Adds `count` empty pools, waiting for each to render before adding the next. */
  async addPools(count: number): Promise<void> {
    const start = await this.poolCards.count();
    for (let i = 1; i <= count; i++) {
      await this.addPoolButton.click();
      await expect(this.poolCards).toHaveCount(start + i, { timeout: TIMEOUTS.short });
    }
  }

  /** Randomly distributes enrolled participants across the existing pools. */
  async seedRandomly(): Promise<void> {
    await expect(this.seedRandomlyButton).toBeEnabled({ timeout: TIMEOUTS.short });
    await this.seedRandomlyButton.click();
  }
}
