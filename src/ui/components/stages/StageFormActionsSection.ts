import { expect, type Locator } from '@playwright/test';
import { TIMEOUTS } from '../../../data/config';
import { nominationStagesSelectors } from '../../selectors';

export class StageFormActionsSection {
  private readonly cancelButton: Locator;
  private readonly saveButton:   Locator;

  constructor(form: Locator) {
    this.cancelButton = form.locator(nominationStagesSelectors.cancelButton);
    this.saveButton   = form.locator(nominationStagesSelectors.saveButton);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.cancelButton).toBeVisible({ timeout: TIMEOUTS.short });
    await expect(this.saveButton).toBeVisible();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async save(): Promise<void> {
    await expect(this.saveButton).toBeEnabled({ timeout: TIMEOUTS.short });
    await this.saveButton.click();
  }
}
