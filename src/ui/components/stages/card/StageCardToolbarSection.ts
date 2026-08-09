import { expect, type Locator, type Page } from '@playwright/test';
import { TIMEOUTS } from '../../../../data/config';
import { nominationStagesSelectors } from '../../../selectors';

export class StageCardToolbarSection {
  private readonly editButton:   Locator;
  private readonly removeButton: Locator;

  constructor(
    private readonly page: Page,
    card: Locator,
    index: number,
  ) {
    this.editButton   = card.locator(nominationStagesSelectors.stageEditButton(index));
    this.removeButton = card.locator(nominationStagesSelectors.stageRemoveButton(index));
  }

  async expectLoaded(): Promise<void> {
    await expect(this.editButton).toBeVisible({ timeout: TIMEOUTS.short });
    await expect(this.removeButton).toBeVisible();
  }

  async clickEdit(): Promise<void> {
    await this.editButton.click();
  }

  /** Accepts the "You sure?" confirm dialog. */
  async removeStage(): Promise<void> {
    this.page.once('dialog', dialog => dialog.accept());
    await this.removeButton.click();
  }

  async expectRemoveEnabled(enabled = true): Promise<void> {
    await expect(this.removeButton)[enabled ? 'toBeEnabled' : 'toBeDisabled']();
  }
}
