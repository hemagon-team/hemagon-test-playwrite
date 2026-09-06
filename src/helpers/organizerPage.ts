import { expect, type Page } from '@playwright/test';
import { TIMEOUTS } from '../data/config';
import { navSelectors } from '../ui/selectors';

/**
 * Logged-in organizer chrome (`.user-block`). Confirms the session is valid and
 * the Vue shell has mounted before page-specific locators are queried.
 */
export async function expectOrganizerShellLoaded(page: Page): Promise<void> {
  await expect(page.locator(navSelectors.userBlock)).toBeVisible({ timeout: TIMEOUTS.long });
}
