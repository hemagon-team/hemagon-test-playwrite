import { expect, type Locator, type Page } from '@playwright/test';
import { TIMEOUTS } from '../../data/config';
import { nominationParticipantsSelectors } from '../selectors';

export type ParticipantRowExpectation = {
  name:  string;
  email?: string;
  club?: string;
};

export class NominationParticipantsSection {
  private readonly page: Page;
  private readonly enrollCountInput:    Locator;
  private readonly enrollTestUsersButton: Locator;
  private readonly participantsTable:   Locator;
  private readonly participantRows:     Locator;

  constructor(page: Page) {
    this.page                 = page;
    this.enrollCountInput     = page.locator(nominationParticipantsSelectors.enrollCountInput);
    this.enrollTestUsersButton = page.locator(nominationParticipantsSelectors.enrollTestUsersButton);
    this.participantsTable    = page.locator(nominationParticipantsSelectors.participantsTable);
    this.participantRows      = page.locator(nominationParticipantsSelectors.participantRows);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.enrollCountInput).toBeVisible({ timeout: TIMEOUTS.long });
    await expect(this.enrollTestUsersButton).toBeVisible();
  }

  async setEnrollCount(count: number): Promise<void> {
    await this.enrollCountInput.fill(String(count));
    await expect(this.enrollCountInput).toHaveValue(String(count));
  }

  /** Fills count and clicks "Enroll test users"; waits until the table shows that many rows. */
  async enrollTestUsers(count: number): Promise<void> {
    await this.setEnrollCount(count);
    await expect(this.enrollTestUsersButton).toBeEnabled({ timeout: TIMEOUTS.short });
    await this.enrollTestUsersButton.click();
    await this.expectParticipantCount(count);
  }

  async expectParticipantsTableVisible(): Promise<void> {
    await expect(this.participantsTable).toBeVisible({ timeout: TIMEOUTS.long });
  }

  async expectParticipantCount(count: number): Promise<void> {
    await this.expectParticipantsTableVisible();
    await expect(this.participantRows).toHaveCount(count, { timeout: TIMEOUTS.long });
  }

  async expectParticipantVisible(details: ParticipantRowExpectation): Promise<void> {
    const row = this.participantRow(details);
    await expect(row).toBeVisible({ timeout: TIMEOUTS.short });
    await expect(row.locator('.user-tooltip-provider')).toHaveText(details.name);

    if (details.email) {
      await expect(row).toContainText(details.email);
    }

    if (details.club) {
      await expect(row).toContainText(details.club);
    }
  }

  async setPresence(details: ParticipantRowExpectation): Promise<void> {
    await this.confirmPresence(this.participantRow(details));
  }

  /** Confirms presence for the row at `index` (0 = first in the table). */
  async confirmPresenceAt(index: number): Promise<void> {
    await this.confirmPresence(this.participantRowAt(index));
  }

  async removeParticipant(details: ParticipantRowExpectation): Promise<void> {
    await this.removeRow(this.participantRow(details));
  }

  /** Removes the last row in the participants table. */
  async removeLastParticipant(): Promise<void> {
    const count = await this.participantRows.count();
    await this.removeRow(this.participantRows.last());
    await this.expectParticipantCount(count - 1);
  }

  /** Asserts presence is confirmed — action switches to "Cancel presence". */
  async expectPresenceConfirmedAt(index: number): Promise<void> {
    await expect(this.participantRowAt(index).getByRole('button', { name: 'Cancel presence' }))
      .toBeVisible({ timeout: TIMEOUTS.short });
  }

  /** Asserts presence is not confirmed — action stays "Set presence". */
  async expectPresenceNotConfirmedAt(index: number): Promise<void> {
    await expect(this.participantRowAt(index).getByRole('button', { name: 'Set presence' }))
      .toBeVisible();
  }

  private participantRowAt(index: number): Locator {
    return this.participantRows.nth(index);
  }

  private participantRow(details: ParticipantRowExpectation): Locator {
    const key = details.email ?? details.name;
    return this.participantRows.filter({ hasText: key });
  }

  private async confirmPresence(row: Locator): Promise<void> {
    await row.getByRole('button', { name: 'Set presence' }).click();
    await expect(row.getByRole('button', { name: 'Cancel presence' }))
      .toBeVisible({ timeout: TIMEOUTS.long });
  }

  private async removeRow(row: Locator): Promise<void> {
    this.page.once('dialog', dialog => dialog.accept());
    await row.locator('button.round').click();
  }
}
