import { expect, type Locator, type Page } from '@playwright/test';
import { TIMEOUTS } from '../../data/config';
import {
  buildNominationSettingsFormData,
  NOMINATION_UI_WEAPON,
  NOMINATION_WEAPON_KATANA_VALUE,
  type NominationSettingsFormData,
} from '../../data/nominationUiData';
import { nominationFormSelectors } from '../selectors';

export { buildNominationSettingsFormData };
export type { NominationSettingsFormData };

export class NominationSettingsFormSection {
  private readonly titleInput:           Locator;
  private readonly slugInput:            Locator;
  private readonly fightingCategoryYes:  Locator;
  private readonly weaponSelect:         Locator;
  private readonly teamYes:              Locator;
  private readonly teamNo:               Locator;
  private readonly twoThirdPlaceYes:     Locator;
  private readonly twoThirdPlaceNo:      Locator;
  private readonly saveButton:           Locator;

  constructor(page: Page) {
    this.titleInput          = page.locator(nominationFormSelectors.titleInput);
    this.slugInput           = page.locator(nominationFormSelectors.slugInput);
    this.fightingCategoryYes = page.locator(nominationFormSelectors.fightingCategoryYes);
    this.weaponSelect        = page.locator(nominationFormSelectors.weaponSelect);
    this.teamYes             = page.locator(nominationFormSelectors.teamYes);
    this.teamNo              = page.locator(nominationFormSelectors.teamNo);
    this.twoThirdPlaceYes    = page.locator(nominationFormSelectors.twoThirdPlaceYes);
    this.twoThirdPlaceNo     = page.locator(nominationFormSelectors.twoThirdPlaceNo);
    this.saveButton          = page.locator(nominationFormSelectors.saveButton);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.titleInput).toBeVisible({ timeout: TIMEOUTS.long });
    await expect(this.slugInput).toBeVisible();
    await expect(this.saveButton).toBeVisible();
  }

  async fill(data: NominationSettingsFormData): Promise<void> {
    await this.titleInput.fill(data.title);
    await this.slugInput.fill(data.slug);

    await this.ensureFightingCategoryYes();
    await this.selectWeaponKatana();

    await this.setBooleanRadio(data.team, this.teamYes, this.teamNo);
    await this.setBooleanRadio(data.twoThirdPlace, this.twoThirdPlaceYes, this.twoThirdPlaceNo);
  }

  async expectValues(data: NominationSettingsFormData): Promise<void> {
    await expect(this.titleInput).toHaveValue(data.title);
    await expect(this.slugInput).toHaveValue(data.slug);
    await expect(this.fightingCategoryYes).toBeChecked();
    await expect(this.weaponSelect).toHaveValue(NOMINATION_WEAPON_KATANA_VALUE);

    const teamRadio = data.team ? this.teamYes : this.teamNo;
    await expect(teamRadio).toBeChecked();

    const placeRadio = data.twoThirdPlace ? this.twoThirdPlaceYes : this.twoThirdPlaceNo;
    await expect(placeRadio).toBeChecked();
  }

  async submit(): Promise<void> {
    await expect(this.saveButton).toBeEnabled({ timeout: TIMEOUTS.short });
    await this.saveButton.click();
  }

  /** Fighting category defaults to Yes; always enforced for autotests. */
  private async ensureFightingCategoryYes(): Promise<void> {
    if (!(await this.fightingCategoryYes.isChecked())) {
      await this.fightingCategoryYes.check();
    }
    await expect(this.fightingCategoryYes).toBeChecked();
  }

  private async selectWeaponKatana(): Promise<void> {
    const katanaOption = this.weaponSelect.locator('option', { hasText: NOMINATION_UI_WEAPON });
    await expect(katanaOption).toHaveCount(1, { timeout: TIMEOUTS.default });
    await this.weaponSelect.selectOption({ label: NOMINATION_UI_WEAPON });
    await expect(this.weaponSelect).toHaveValue(NOMINATION_WEAPON_KATANA_VALUE);
  }

  private async setBooleanRadio(value: boolean, yes: Locator, no: Locator): Promise<void> {
    const target = value ? yes : no;
    if (!(await target.isChecked())) {
      await target.check();
    }
    await expect(target).toBeChecked();
  }
}
