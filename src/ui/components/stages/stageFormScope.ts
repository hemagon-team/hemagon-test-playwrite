import type { Locator, Page } from '@playwright/test';
import { nominationStagesSelectors } from '../../selectors';

/** Add-stage form card scoped by the "Adding" heading. */
export function stageAddFormCard(page: Page): Locator {
  return page.locator(nominationStagesSelectors.formCard).filter({
    has: page.locator(nominationStagesSelectors.formTitle, { hasText: 'Adding' }),
  });
}

/** Edit-stage form card scoped by the "Editing" heading (opened via a card's Edit button). */
export function stageEditFormCard(page: Page): Locator {
  return page.locator(nominationStagesSelectors.formCard).filter({
    has: page.locator(nominationStagesSelectors.formTitle, { hasText: 'Editing' }),
  });
}
