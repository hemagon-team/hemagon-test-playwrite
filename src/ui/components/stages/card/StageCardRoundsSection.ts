import { expect, type Locator } from '@playwright/test';
import { TIMEOUTS } from '../../../../data/config';
import { nominationStagesSelectors } from '../../../selectors';
import { StageCardRoundSection } from './StageCardRoundSection';

/** Rounds/pools container on a saved stage card. */
export class StageCardRoundsSection {
  private readonly rounds: Locator;

  constructor(
    private readonly card: Locator,
    private readonly page: import('@playwright/test').Page,
    private readonly stageIndex: number,
  ) {
    this.rounds = card.locator(nominationStagesSelectors.stageRoundsContainer);
  }

  roundAt(poolIndex: number): StageCardRoundSection {
    return new StageCardRoundSection(this.card, this.page, this.stageIndex, poolIndex);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.rounds).toBeVisible({ timeout: TIMEOUTS.short });
  }

  async count(): Promise<number> {
    return this.card.locator(nominationStagesSelectors.stageRoundCard).count();
  }

  async expectCount(count: number): Promise<void> {
    await expect(this.card.locator(nominationStagesSelectors.stageRoundCard))
      .toHaveCount(count, { timeout: TIMEOUTS.long });
  }

  /** Every pool card on the stage must hold between `min` and `max` fighters (inclusive). */
  async expectAllPoolsFightersInRange(min: number, max: number): Promise<void> {
    const poolCount = await this.count();
    for (let i = 0; i < poolCount; i++) {
      await this.roundAt(i).expectUsersCountInRange(min, max);
    }
  }
}
