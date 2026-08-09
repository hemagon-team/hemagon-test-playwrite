import { expect, type Locator } from '@playwright/test';
import { TIMEOUTS } from '../../../../data/config';
import { nominationStagesSelectors } from '../../../selectors';

/** POOL / SWISS — draggable participants panel, scoped to the stage's outer wrapper. */
export class StageCardParticipantsSection {
  private readonly panel:       Locator;
  private readonly searchInput: Locator;

  constructor(outerCard: Locator) {
    this.panel       = outerCard.locator(nominationStagesSelectors.stageParticipantsPanel);
    this.searchInput = this.panel.locator(nominationStagesSelectors.stageParticipantsSearch);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.panel.getByText('Participants', { exact: true }))
      .toBeVisible({ timeout: TIMEOUTS.short });
    await expect(this.searchInput).toBeVisible();
  }

  async expectParticipantCount(count: number): Promise<void> {
    const header = this.panel.locator('.h5', { hasText: 'Participants' }).locator('..');
    await expect(header).toContainText(String(count), { timeout: TIMEOUTS.short });
  }
}
