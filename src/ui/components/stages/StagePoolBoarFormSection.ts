import { expect, type Locator } from '@playwright/test';
import { TIMEOUTS } from '../../../data/config';
import { StageType } from '../../../data/nominationStageData';
import { nominationStagesSelectors } from '../../selectors';

/** Fields unique to the Pools BOAR stage type. Extend as selectors are discovered. */
export class StagePoolBoarFormSection {
  constructor(private readonly form: Locator) {}

  async expectLoaded(): Promise<void> {
    await expect(this.form.locator(nominationStagesSelectors.typeRadio(StageType.PoolBoar)))
      .toBeChecked({ timeout: TIMEOUTS.short });
  }
}
