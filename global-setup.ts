import * as fs from 'node:fs';
import * as path from 'node:path';
import type { FullConfig } from '@playwright/test';

export default async function globalSetup(_config: FullConfig): Promise<void> {
  if (process.env.KEEP_ALLURE_RESULTS === '1') {
    return;
  }
  const dir = path.join(process.cwd(), 'allure-results');
  fs.rmSync(dir, { recursive: true, force: true });
}
