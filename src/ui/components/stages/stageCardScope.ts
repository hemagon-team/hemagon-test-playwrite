import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { TIMEOUTS } from '../../../data/config';
import { nominationStagesSelectors } from '../../selectors';

/**
 * Stage cards are addressed by numeric `index` matching `#btn-stage-{n}-remove`.
 * The index is positional and reassigned by the app, so it shifts after a stage
 * is removed — re-resolve cards after any add/remove.
 */

/** Saved stage body — inner `.card` around toolbar, settings, and rounds. */
export function stageCardAt(page: Page, index: number): Locator {
  return page.locator(nominationStagesSelectors.stageRemoveButton(index)).locator(
    'xpath=ancestor::div[contains(@class,"card")][1]',
  );
}

/** Outer stage wrapper — bounded per-stage block that also holds the participants panel. */
export function stageOuterCardAt(page: Page, index: number): Locator {
  return page.locator(nominationStagesSelectors.stageRemoveButton(index)).locator(
    'xpath=ancestor::div[contains(@class,"card")][last()]',
  );
}

/** Collapse/expand toggle — last icon button in the stage header row above `.stage-settings`. */
export function stageCollapseToggle(page: Page, index: number): Locator {
  return stageCardAt(page, index)
    .locator(nominationStagesSelectors.stageSettings)
    .locator('xpath=preceding-sibling::div[1]//button')
    .last();
}

/** POOL card scoped from its stable `#btn-stage-{s}-pool-{p}-run` id. */
export function poolCardAt(page: Page, stageIndex: number, poolIndex: number): Locator {
  return page.locator(nominationStagesSelectors.poolRunButton(stageIndex, poolIndex)).locator(
    'xpath=ancestor::div[contains(@class,"card-small")][1]',
  );
}

/** Expands a collapsed stage card so the given pool locator becomes visible. */
export async function expandStagePoolIfNeeded(
  page: Page,
  stageIndex: number,
  poolAnchor: Locator,
): Promise<void> {
  if (await poolAnchor.isVisible()) return;

  const card    = stageCardAt(page, stageIndex);
  const anyPool = card.locator(nominationStagesSelectors.stageRoundCard).first();

  if (await anyPool.isVisible()) {
    await poolAnchor.scrollIntoViewIfNeeded();
    if (await poolAnchor.isVisible()) return;
  }

  const toggle = stageCollapseToggle(page, stageIndex);
  await expect(toggle).toBeVisible({ timeout: TIMEOUTS.short });
  await toggle.click();

  if (!(await poolAnchor.isVisible())) {
    // Toggle is bidirectional — a second click expands when the first collapsed.
    await toggle.click();
  }

  await expect(poolAnchor).toBeVisible({ timeout: TIMEOUTS.long });
}
