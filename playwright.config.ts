import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import { ORGANIZER_STORAGE_STATE } from './src/data/config';

dotenv.config();

// Screenshots are failure-only: "on" produced blank about:blank shots for API-driven
// UI specs (e.g. participant pool) that never navigate.
const uiReportingArtifacts = {
  screenshot: { mode: 'only-on-failure' as const, fullPage: true },
  video:      'retain-on-failure' as const,
};

export default defineConfig({
  testDir: './tests',

  globalSetup: './global-setup.ts',

  // Hemagon supports multiple sessions per account — parallel is safe once staging exists.
  fullyParallel: true,
  workers: process.env.CI ? 2 : Number(process.env.WORKERS ?? 1),

  retries: process.env.CI ? 2 : 1,

  reporter: [
    [
      'allure-playwright',
      {
        resultsDir:  'allure-results',
        suiteTitle:  false, // group by test.describe, not file path
      },
    ],
    ['line'],
  ],

  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
  },

  projects: [
    {
      // Logs the organizer in once and saves storageState for all UI projects.
      name: 'auth-setup',
      testMatch: 'setup/auth.setup.ts',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
    {
      // Seeds the shared participant pool via UI once; cached on disk for later runs.
      name: 'pool-setup',
      testMatch: 'setup/pool.setup.ts',
      dependencies: ['auth-setup'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: ORGANIZER_STORAGE_STATE,
      },
    },
    {
      name: 'API',
      testMatch: 'API/**/*.spec.ts',
      dependencies: ['pool-setup'],
      use: {
        baseURL: process.env.BASE_URL,
      },
    },
    {
      name: 'UI',
      testMatch: 'UI/**/*.spec.ts',
      dependencies: ['pool-setup'],
      use: {
        ...devices['Desktop Chrome'],
        ...uiReportingArtifacts,
        storageState: ORGANIZER_STORAGE_STATE,
      },
    },
  ],
});
