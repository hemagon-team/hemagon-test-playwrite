import * as fs from 'node:fs';
import * as path from 'node:path';
import type { FullConfig } from '@playwright/test';

/** Wipe contents but keep the directory — bind mounts cannot be rmSync'd from inside Docker. */
function clearDirectory(dir: string): void {
  if (!fs.existsSync(dir)) return;

  for (const entry of fs.readdirSync(dir)) {
    fs.rmSync(path.join(dir, entry), { recursive: true, force: true });
  }
}

export default async function globalSetup(_config: FullConfig): Promise<void> {
  if (process.env.KEEP_ALLURE_RESULTS === '1') {
    return;
  }
  clearDirectory(path.join(process.cwd(), 'allure-results'));
}
