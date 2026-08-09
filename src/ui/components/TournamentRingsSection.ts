import { expect, type Locator, type Page } from '@playwright/test';
import { TIMEOUTS } from '../../data/config';

export class TournamentRingsSection {
  private readonly addRingButton: Locator;
  private readonly saveButton:    Locator;

  constructor(private readonly page: Page) {
    this.addRingButton = page.getByRole('button', { name: /add ring/i });
    this.saveButton    = page.getByRole('button', { name: /^save$/i });
  }

  async expectLoaded(): Promise<void> {
    await expect(this.addRingButton).toBeVisible({ timeout: TIMEOUTS.long });
  }

  async createRing(title: string): Promise<void> {
    await this.addRingButton.click();

    // The ring title field has no stable id yet; it is the freshly revealed text input.
    const titleInput = this.page.locator('input[type="text"]').last();
    await expect(titleInput).toBeVisible({ timeout: TIMEOUTS.short });
    await titleInput.fill(title);

    await expect(this.saveButton).toBeEnabled({ timeout: TIMEOUTS.short });
    await this.saveButton.click();
  }

  async expectRingVisible(title: string): Promise<void> {
    await expect(this.page.getByText(title, { exact: true })).toBeVisible({ timeout: TIMEOUTS.short });
  }
}
