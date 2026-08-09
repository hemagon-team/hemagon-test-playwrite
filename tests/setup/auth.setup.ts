import { test as setup } from '@playwright/test';
import { ORGANIZER_STORAGE_STATE } from '../../src/data/config';
import { loginAs, expectLoggedIn } from '../../src/fixtures/auth.fixture';

/**
 * Logs the organizer in once per run and saves the session to
 * `.cache/auth/organizer.json`. All UI projects reuse it via `storageState`,
 * so individual tests never go through the login form.
 */
setup('authenticate organizer', async ({ page }) => {
  await loginAs(page);
  await expectLoggedIn(page);
  await page.context().storageState({ path: ORGANIZER_STORAGE_STATE });
});
