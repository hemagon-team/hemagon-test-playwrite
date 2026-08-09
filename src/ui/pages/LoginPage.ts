import { Page, Locator, expect } from '@playwright/test';
import { loginSelectors } from '../selectors';

export class LoginPage {
  private readonly emailInput:    Locator;
  private readonly passwordInput: Locator;
  private readonly submitButton:  Locator;

  constructor(private page: Page) {
    this.emailInput    = page.locator(loginSelectors.emailInput);
    this.passwordInput = page.locator(loginSelectors.passwordInput);
    this.submitButton  = page.locator(loginSelectors.submitButton);
  }

  async open(): Promise<void> {
    await this.page.goto('/login');
    await this.dismissCookieBannerIfVisible();
    await expect(this.emailInput).toBeVisible();
  }

  async login(email: string, password: string): Promise<void> {
    await this.dismissCookieBannerIfVisible();
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
    await this.page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 30_000 });
  }

  async dismissCookieBannerIfVisible(): Promise<void> {
    const accept = this.page.getByRole('button', { name: /yes, i agree|understood/i });
    if (await accept.isVisible().catch(() => false)) {
      await accept.click();
    }
  }
}
