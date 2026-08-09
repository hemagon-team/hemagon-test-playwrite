import { expect, type Locator } from '@playwright/test';
import { TIMEOUTS } from '../../../data/config';
import { StageType } from '../../../data/nominationStageData';
import { nominationStagesSelectors } from '../../selectors';

/** Fields unique to the Double Elimination stage type. Extend as selectors are discovered. */
export class StageDoubleEliminationFormSection {
  constructor(private readonly form: Locator) {}

  async expectLoaded(): Promise<void> {
    await expect(this.form.locator(nominationStagesSelectors.typeRadio(StageType.DoubleElimination)))
      .toBeChecked({ timeout: TIMEOUTS.short });
  }
}
