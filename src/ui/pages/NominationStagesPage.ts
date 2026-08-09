import { expect, type Page } from '@playwright/test';
import { TIMEOUTS } from '../../data/config';
import { nominationStagesSelectors } from '../selectors';
import { NominationStagesCardsSection } from '../components/stages/NominationStagesCardsSection';
import { StageAddFormSection } from '../components/stages/StageAddFormSection';
import { StageBuilderSection } from '../components/stages/StageBuilderSection';
import { StageEditFormSection } from '../components/stages/StageEditFormSection';
import { NominationPublicPage } from './NominationPublicPage';

/**
 * Single route: `/nominations/:id/stages`.
 * UI areas on the same page — saved stages (`stages`), the inline add form (`addStage`),
 * and the inline edit form (`editStage`, opened from a card's Edit button).
 *
 * For most tests prefer the fluent `add` builder (`add.pool(...)`, `add.elimination(...)`),
 * which saves a stage and returns its card; drop to `addStage`/`editStage` for finer control.
 */
export class NominationStagesPage {
  readonly stages:    NominationStagesCardsSection;
  readonly addStage:  StageAddFormSection;
  readonly editStage: StageEditFormSection;
  readonly add:       StageBuilderSection;

  constructor(private readonly page: Page) {
    this.stages    = new NominationStagesCardsSection(page);
    this.addStage  = new StageAddFormSection(page);
    this.editStage = new StageEditFormSection(page);
    this.add       = new StageBuilderSection(this.stages, this.addStage);
  }

  async open(tournamentId: string, nominationId: string): Promise<void> {
    await this.page.goto(
      `/organizer/tournaments/${tournamentId}/nominations/${nominationId}/stages`,
    );
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await this.page.waitForURL(
      /\/organizer\/tournaments\/[a-f0-9]+\/nominations\/[a-f0-9]+\/stages(?:$|\?)/,
      { timeout: TIMEOUTS.long },
    );
    await this.stages.expectLoaded();
  }

  async openAddStageForm(): Promise<void> {
    await this.stages.openAddForm();
    await this.addStage.expectLoaded();
  }

  /** Opens the public bracket via the nomination header link. */
  async goToPublicPage(): Promise<NominationPublicPage> {
    const link = this.page.locator(nominationStagesSelectors.goToPublicPageLink);
    await expect(link).toBeVisible({ timeout: TIMEOUTS.short });
    await link.click();

    const publicPage = new NominationPublicPage(this.page);
    await publicPage.expectLoaded();
    return publicPage;
  }
}
