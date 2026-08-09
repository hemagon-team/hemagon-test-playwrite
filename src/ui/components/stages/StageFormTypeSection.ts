import { expect, type Locator } from '@playwright/test';
import { TIMEOUTS } from '../../../data/config';
import { StageType, type StageTypeCode } from '../../../data/nominationStageData';
import { nominationStagesSelectors } from '../../selectors';

export class StageFormTypeSection {
  constructor(private readonly form: Locator) {}

  async expectLoaded(): Promise<void> {
    await expect(this.typeRadio(StageType.Pool)).toBeVisible({ timeout: TIMEOUTS.short });
    await expect(this.typeRadio(StageType.Elimination)).toBeVisible();
    await expect(this.typeRadio(StageType.DoubleElimination)).toBeVisible();
    await expect(this.typeRadio(StageType.Swiss)).toBeVisible();
    await expect(this.typeRadio(StageType.SwissHits)).toBeVisible();
    await expect(this.typeRadio(StageType.PoolBoar)).toBeVisible();
  }

  async selectType(type: StageTypeCode): Promise<void> {
    const radio = this.typeRadio(type);
    if (!(await radio.isChecked())) {
      await radio.check();
    }
    await expect(radio).toBeChecked();
  }

  async expectTypeSelected(type: StageTypeCode): Promise<void> {
    await expect(this.typeRadio(type)).toBeChecked();
  }

  private typeRadio(type: StageTypeCode): Locator {
    return this.form.locator(nominationStagesSelectors.typeRadio(type));
  }
}
