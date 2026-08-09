import { expect, type Locator, type Page } from '@playwright/test';
import { TIMEOUTS } from '../../../../data/config';
import { nominationStagesSelectors, popupSelectors } from '../../../selectors';
import { StandingsTableSection } from '../../standings/StandingsTableSection';

/**
 * SWISS — the "Rating" button on a stage card opens the stage standings in a modal
 * rendered at page level (not inside the card), using the same table markup as both
 * public standings views.
 */
export class StageCardRatingSection {
  readonly standings: StandingsTableSection;

  private readonly toggle:      Locator;
  private readonly closeButton: Locator;

  constructor(page: Page, stageIndex: number) {
    this.toggle = page.locator(nominationStagesSelectors.stageRatingButton(stageIndex));

    const popup = page.locator(popupSelectors.root).filter({
      has: page.getByRole('heading', {
        name: nominationStagesSelectors.stageRatingModalTitle,
      }),
    });

    this.standings   = new StandingsTableSection(
      popup.locator('table'),
      `stage ${stageIndex} rating`,
    );
    this.closeButton = popup.locator(popupSelectors.closeButton);
  }

  /** Opens the modal if it is not already showing and returns the standings table. */
  async open(): Promise<StandingsTableSection> {
    await expect(this.toggle).toBeVisible({ timeout: TIMEOUTS.short });

    if (!(await this.standings.isVisible())) {
      await this.toggle.click();
    }

    await this.standings.expectLoaded();
    return this.standings;
  }

  /** Dismisses the modal — its backdrop blocks the rest of the page while open. */
  async close(): Promise<void> {
    await expect(this.closeButton).toBeVisible({ timeout: TIMEOUTS.short });
    await this.closeButton.click();
    await this.standings.expectHidden();
  }
}
