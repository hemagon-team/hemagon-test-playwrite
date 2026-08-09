import { test, expect } from '../../src/fixtures/test';
import { loginAs, expectLoggedIn } from '../../src/fixtures/auth.fixture';
import { TIMEOUTS } from '../../src/data/config';
import { UserRole, users } from '../../src/data/users';
import { loginSelectors } from '../../src/ui/selectors';

test.describe('Auth UI', () => {
  test.describe.configure({ timeout: 60_000 });

  // This suite exercises the login form itself — start without the shared session.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('organizer can log in via UI', async ({ page }) => {
    await loginAs(page, UserRole.Organizer);
    await expectLoggedIn(page);
  });

  test('invalid credentials stay on login page', async ({ page }) => {
    await page.goto('/login');

    const cookie = page.getByRole('button', { name: /yes, i agree/i });
    if (await cookie.isVisible().catch(() => false)) {
      await cookie.click();
    }

    await page.locator(loginSelectors.emailInput).fill('invalid@example.com');
    await page.locator(loginSelectors.passwordInput).fill('wrong-password');
    await page.locator(loginSelectors.submitButton).click();

    await expect(page).toHaveURL(/\/login/, { timeout: TIMEOUTS.default });
    await expect(page.locator(loginSelectors.emailInput)).toBeVisible();
    expect(users[UserRole.Organizer].email).not.toBe('invalid@example.com');
  });
});
