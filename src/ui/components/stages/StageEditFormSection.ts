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

  /** Selects a preset or custom "Goes next stage" count (all-advance = roster size). */
  async setOutputCount(count: number): Promise<void> {
    const preset = this.form.locator(nominationStagesSelectors.outputCountRadio(count));

    if (await preset.isVisible()) {
      await preset.check();
      await expect(preset).toBeChecked();
      return;
    }

    const customRadio = this.form.locator(nominationStagesSelectors.outputCountCustomRadio);
    await customRadio.check();
    await expect(customRadio).toBeChecked();

    const customInput = this.form.locator(nominationStagesSelectors.outputCountCustomInput);
    await expect(customInput).toBeVisible({ timeout: TIMEOUTS.short });
    await customInput.fill(String(count));
    await expect(customInput).toHaveValue(String(count));
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
