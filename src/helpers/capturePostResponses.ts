import type { Page, Response } from '@playwright/test';
import type { ZodType } from 'zod';
import { TIMEOUTS } from '../data/config';

/**
 * Collects every successful POST response matching `urlPart` while `action` runs
 * and for `settleMs` afterwards (UI enroll fires many parallel POSTs).
 */
export async function capturePostResponses<T>(
  page:    Page,
  urlPart: string,
  action:  () => Promise<void>,
  schema:  ZodType<T>,
  options: {
    method?:   string;
    settleMs?: number;
    timeout?:  number;
  } = {},
): Promise<T[]> {
  const method   = options.method ?? 'POST';
  const settleMs = options.settleMs ?? 2_000;
  const timeout  = options.timeout ?? TIMEOUTS.long;
  const captured: T[] = [];

  const handler = async (response: Response): Promise<void> => {
    if (
      response.request().method() !== method ||
      !response.url().includes(urlPart) ||
      !response.ok()
    ) {
      return;
    }

    try {
      captured.push(schema.parse(await response.json()));
    } catch {
      // Ignore unrelated POST bodies on the same path.
    }
  };

  page.on('response', handler);

  try {
    await Promise.race([
      action(),
      page.waitForTimeout(timeout).then(() => {
        throw new Error(`capturePostResponses action timed out after ${timeout}ms`);
      }),
    ]);
    await page.waitForTimeout(settleMs);
  } finally {
    page.off('response', handler);
  }

  return captured;
}
