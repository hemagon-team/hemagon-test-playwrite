/** API path prefix observed on Hemagon prod and stage (e.g. GET /api/tournaments). */
export const API_PREFIX = '/api';

export const AUTH_LOGIN_PATH = `${API_PREFIX}/auth/login`;

/** Organizer session saved by the `auth-setup` project and reused by UI projects. */
export const ORGANIZER_STORAGE_STATE = '.cache/auth/organizer.json';

/** Shared UI/API wait budgets so individual page objects don't hardcode numbers. */
export const TIMEOUTS = {
  short:   10_000,
  default: 15_000,
  /** Stage under parallel Docker CI can exceed 30s before interactive widgets render. */
  long:    process.env.CI ? 60_000 : 30_000,
} as const;
