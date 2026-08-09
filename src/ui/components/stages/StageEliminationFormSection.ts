import { expect, type Locator } from '@playwright/test';
import { TIMEOUTS } from '../../../data/config';
import { StageType } from '../../../data/nominationStageData';
import { nominationStagesSelectors } from '../../selectors';

/** Fields unique to the Elimination stage type. Extend as selectors are discovered. */
export class StageEliminationFormSection {
  constructor(private readonly form: Locator) {}

  async expectLoaded(): Promise<void> {
    await expect(this.form.locator(nominationStagesSelectors.typeRadio(StageType.Elimination)))
      .toBeChecked({ timeout: TIMEOUTS.short });
  }

  /** "Hold a fight for the third place" radio (bronze fight in the finals round). */
  async setFightForThirdPlace(value: boolean): Promise<void> {
    const radio = this.form.locator(nominationStagesSelectors.fightForThirdPlaceRadio(value));
    await radio.check();
    await expect(radio).toBeChecked();
  }
}
