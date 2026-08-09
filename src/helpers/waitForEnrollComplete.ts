import { expect, type Page } from '@playwright/test';
import {
  PARTICIPANT_ENROLL_STABLE_MS,
  PARTICIPANT_ENROLL_TIMEOUT_MS,
} from '../data/participantData';
import { nominationParticipantsSelectors } from '../ui/selectors';

/**
 * Waits until the participants table row count stops changing — UI enroll is a
 * burst of parallel POST /organizer/requests calls, not a single response.
 */
export async function waitForEnrollComplete(page: Page): Promise<number> {
  const rows = page.locator(nominationParticipantsSelectors.participantRows);

  await expect(page.locator(nominationParticipantsSelectors.participantsTable))
    .toBeVisible({ timeout: PARTICIPANT_ENROLL_TIMEOUT_MS });

  let lastCount   = -1;
  let stableSince = Date.now();
  const deadline  = Date.now() + PARTICIPANT_ENROLL_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const count = await rows.count();

    if (count === lastCount) {
      if (count > 0 && Date.now() - stableSince >= PARTICIPANT_ENROLL_STABLE_MS) {
        return count;
      }
    } else {
      lastCount   = count;
      stableSince = Date.now();
    }

    await page.waitForTimeout(500);
  }

  return rows.count();
}
