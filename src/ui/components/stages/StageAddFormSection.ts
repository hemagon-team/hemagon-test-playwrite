import { expect, type Page } from '@playwright/test';
import { TIMEOUTS } from '../../../data/config';
import { StageDoubleEliminationFormSection } from './StageDoubleEliminationFormSection';
import { StageEliminationFormSection } from './StageEliminationFormSection';
import { StageFormActionsSection } from './StageFormActionsSection';
import { StageFormCommonSection } from './StageFormCommonSection';
import { StageFormTypeSection } from './StageFormTypeSection';
import { StagePoolBoarFormSection } from './StagePoolBoarFormSection';
import { StagePoolFormSection } from './StagePoolFormSection';
import { StageSwissFormSection } from './StageSwissFormSection';
import { StageSwissHitsFormSection } from './StageSwissHitsFormSection';
import { stageAddFormCard } from './stageFormScope';

export class StageAddFormSection {
  readonly type:              StageFormTypeSection;
  readonly common:            StageFormCommonSection;
  readonly pool:              StagePoolFormSection;
  readonly elimination:       StageEliminationFormSection;
  readonly doubleElimination: StageDoubleEliminationFormSection;
  readonly swiss:             StageSwissFormSection;
  readonly swissHits:         StageSwissHitsFormSection;
  readonly poolBoar:          StagePoolBoarFormSection;
  readonly actions:           StageFormActionsSection;

  constructor(private readonly page: Page) {
    const form = stageAddFormCard(page);

    this.type              = new StageFormTypeSection(form);
    this.common            = new StageFormCommonSection(form);
    this.pool              = new StagePoolFormSection(form);
    this.elimination       = new StageEliminationFormSection(form);
    this.doubleElimination = new StageDoubleEliminationFormSection(form);
    this.swiss             = new StageSwissFormSection(form);
    this.swissHits         = new StageSwissHitsFormSection(form);
    this.poolBoar          = new StagePoolBoarFormSection(form);
    this.actions           = new StageFormActionsSection(form);
  }

  async expectLoaded(): Promise<void> {
    await expect(stageAddFormCard(this.page)).toBeVisible({ timeout: TIMEOUTS.long });
    await this.type.expectLoaded();
    await this.common.expectLoaded();
    await this.actions.expectLoaded();
  }
}
