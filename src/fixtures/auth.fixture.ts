import { Page, expect } from '@playwright/test';
import { TIMEOUTS } from '../data/config';
import { LoginPage } from '../ui/pages/LoginPage';
import { navSelectors } from '../ui/selectors';
import { users, UserRole } from '../data/users';

export async function loginAs(page: Page, role: UserRole = UserRole.Organizer): Promise<void> {
  const creds = users[role];
  const loginPage = new LoginPage(page);
  await loginPage.open();
  await loginPage.login(creds.email, creds.password);
}

export async function expectLoggedIn(page: Page): Promise<void> {
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.locator(navSelectors.userBlock)).toBeVisible({ timeout: TIMEOUTS.default });
}
