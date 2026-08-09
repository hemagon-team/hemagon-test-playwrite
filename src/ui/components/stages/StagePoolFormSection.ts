import { expect, type Locator } from '@playwright/test';
import { TIMEOUTS } from '../../../data/config';
import { nominationStagesSelectors } from '../../selectors';

export class StagePoolFormSection {
  /** Hidden real checkbox — used only to read/assert state. */
  private readonly unlimitedPool:       Locator;
  /** Visible custom switch — the only actionable target. */
  private readonly unlimitedPoolSwitch: Locator;

  constructor(form: Locator) {
    this.unlimitedPool       = form.locator(nominationStagesSelectors.unlimitedPool);
    this.unlimitedPoolSwitch = form.locator(nominationStagesSelectors.unlimitedPoolSwitch);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.unlimitedPoolSwitch).toBeVisible({ timeout: TIMEOUTS.short });
  }

  /**
   * Toggles the "Unlimited pool" switch. The underlying checkbox is visually hidden
   * (covered by the slider) and never actionable, so we click the switch and assert
   * via the checkbox's `checked` property.
   */
  async setUnlimitedPool(enabled: boolean): Promise<void> {
    if ((await this.unlimitedPool.isChecked()) !== enabled) {
      await this.unlimitedPoolSwitch.click();
    }
    await expect(this.unlimitedPool).toBeChecked({ checked: enabled });
  }
}
