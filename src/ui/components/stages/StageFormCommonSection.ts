import { expect, type Locator } from '@playwright/test';
import { TIMEOUTS } from '../../../data/config';
import type { TillFinalsOption } from '../../../data/nominationStageData';
import { nominationStagesSelectors } from '../../selectors';

export class StageFormCommonSection {
  private readonly fightTimeInput: Locator;
  private readonly tillFinalsYes:  Locator;
  private readonly tillFinalsNo:   Locator;
  private readonly tillFinalsQual: Locator;

  constructor(form: Locator) {
    this.fightTimeInput = form.locator(nominationStagesSelectors.fightTimeInput);
    this.tillFinalsYes  = form.locator(nominationStagesSelectors.tillFinalsYes);
    this.tillFinalsNo   = form.locator(nominationStagesSelectors.tillFinalsNo);
    this.tillFinalsQual = form.locator(nominationStagesSelectors.tillFinalsQual);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.fightTimeInput).toBeVisible({ timeout: TIMEOUTS.short });
    await expect(this.tillFinalsYes).toBeVisible();
  }

  async setFightTime(seconds: number): Promise<void> {
    await this.fightTimeInput.fill(String(seconds));
    await expect(this.fightTimeInput).toHaveValue(String(seconds));
  }

  async setTillFinals(option: TillFinalsOption): Promise<void> {
    const target = {
      yes:           this.tillFinalsYes,
      no:            this.tillFinalsNo,
      qualification: this.tillFinalsQual,
    }[option];

    if (!(await target.isChecked())) {
      await target.check();
    }
    await expect(target).toBeChecked();
  }
}
