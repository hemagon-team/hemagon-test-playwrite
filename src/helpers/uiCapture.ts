import { expect, type Page } from '@playwright/test';
import type { ZodType } from 'zod';
import { TIMEOUTS } from '../data/config';

/**
 * Runs a UI action that triggers a POST, waits for the matching response,
 * asserts it succeeded, and returns the schema-validated body.
 *
 * `waitForResponse` is registered before the action fires, so fast responses
 * are never missed.
 */
export async function submitAndCapture<T>(
  page:    Page,
  urlPart: string,
  action:  () => Promise<void>,
  schema:  ZodType<T>,
): Promise<T> {
  const [response] = await Promise.all([
    page.waitForResponse(
      res => res.url().includes(urlPart) && res.request().method() === 'POST',
      { timeout: TIMEOUTS.long },
    ),
    action(),
  ]);

  expect(
    response.ok(),
    `POST ${urlPart} failed: ${response.status()} ${await response.text()}`,
  ).toBeTruthy();

  return schema.parse(await response.json());
}
