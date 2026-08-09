import type { APIRequestContext, TestInfo } from '@playwright/test';

export interface CleanupResult<K extends number | string = number | string> {
  ok:          boolean;
  key:         K;
  attempts:    number;
  lastStatus?: number;
  lastBody?:   string;
}

/** DELETE with one retry; never throws — failures come back as a CleanupResult. */
export async function deleteResource<K extends number | string>(
  api:     APIRequestContext,
  url:     string,
  headers: Record<string, string>,
  key:     K,
  label:   string,
): Promise<CleanupResult<K>> {
  let lastStatus: number | undefined;
  let lastBody:   string | undefined;

  for (let attempt = 1; attempt <= 2; attempt++) {
    const res = await api.delete(url, { headers });
    if (res.ok()) return { ok: true, key, attempts: attempt };
    lastStatus = res.status();
    lastBody   = await res.text();
    if (attempt < 2) {
      console.warn(`${label} attempt ${attempt} failed (${lastStatus}), retrying…`);
    } else {
      console.warn(`${label} failed after 2 attempts: ${lastStatus} ${lastBody}`);
    }
  }

  return { ok: false, key, attempts: 2, lastStatus, lastBody };
}

/** afterEach / test body: attach a failed cleanup to the Allure report. */
export async function reportCleanupFailure(
  testInfo: TestInfo,
  result:   CleanupResult,
): Promise<void> {
  if (result.ok) return;

  await testInfo.attach(`cleanup-failed ${result.key}`, {
    contentType: 'application/json',
    body:        Buffer.from(`${JSON.stringify(result, null, 2)}\n`),
  });
}

