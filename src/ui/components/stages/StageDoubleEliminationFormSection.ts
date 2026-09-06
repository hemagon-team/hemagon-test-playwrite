import { expect, type Locator } from '@playwright/test';
import { TIMEOUTS } from '../../../data/config';
import type { DoubleElimFinalsMode } from '../../../data/doubleElimData';
import { StageType } from '../../../data/nominationStageData';
import { nominationStagesSelectors } from '../../selectors';

/** Fields unique to the Double Elimination stage type. */
export class StageDoubleEliminationFormSection {
  constructor(private readonly form: Locator) {}

  async expectLoaded(): Promise<void> {
    await expect(this.form.locator(nominationStagesSelectors.typeRadio(StageType.DoubleElimination)))
      .toBeChecked({ timeout: TIMEOUTS.short });
    await expect(this.form.locator(nominationStagesSelectors.finalsModeRadio('BO_1')))
      .toBeVisible();
  }

  /** "Finals mode" — Best of 1 / Best of 3 (`#input-stage-finalsMode-bo1|bo3`). */
  async setFinalsMode(mode: DoubleElimFinalsMode): Promise<void> {
    const radio = this.form.locator(nominationStagesSelectors.finalsModeRadio(mode));
    await radio.check();
    await expect(radio).toBeChecked();
  }
}
