import { expect, type Locator, type Page } from '@playwright/test';
import { TIMEOUTS } from '../../../data/config';
import type { MinimumFromEachPool } from '../../../data/nominationStageData';
import { nominationStagesSelectors } from '../../selectors';
import { stageEditFormCard } from './stageFormScope';

/**
 * Inline "Editing" form for a saved stage (opened from a card's Edit button).
 * Stage type is locked here; its main extra control is the semi-automatic
 * "Goes next stage" output count, which only appears once a later stage exists.
 */
export class StageEditFormSection {
  private readonly form:       Locator;
  private readonly saveButton: Locator;

  constructor(page: Page) {
    this.form       = stageEditFormCard(page);
    this.saveButton = this.form.locator(nominationStagesSelectors.saveButton);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.form).toBeVisible({ timeout: TIMEOUTS.long });
  }

  /** Selects a preset "Goes next stage" count (2 / 4 / 8 / 16 / 32 / 64). */
  async setOutputCount(count: number): Promise<void> {
    const radio = this.form.locator(nominationStagesSelectors.outputCountRadio(count));
    await radio.check();
    await expect(radio).toBeChecked();
  }

  /** Selects how many fighters are guaranteed to advance from each pool ("any" or 1–5). */
  async setMinimumFromEachPool(value: MinimumFromEachPool): Promise<void> {
    const radio = this.form.locator(nominationStagesSelectors.minimumFromEachPoolRadio(value));
    await radio.check();
    await expect(radio).toBeChecked();
  }

  async save(): Promise<void> {
    await expect(this.saveButton).toBeEnabled({ timeout: TIMEOUTS.short });
    await this.saveButton.click();
    await expect(this.form).toBeHidden({ timeout: TIMEOUTS.long });
  }
}
