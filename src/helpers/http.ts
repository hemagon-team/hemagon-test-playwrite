import type { APIResponse } from '@playwright/test';

/** Throws a consistent error if the response is not ok; returns it otherwise. */
export async function assertOk(res: APIResponse, context: string): Promise<APIResponse> {
  if (!res.ok()) {
    throw new Error(`${context} failed: ${res.status()} ${await res.text()}`);
  }
  return res;
}
