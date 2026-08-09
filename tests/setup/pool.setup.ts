import { test as setup } from '@playwright/test';
import { authenticateApi } from '../../src/fixtures/apiAuth.fixture';
import { PARTICIPANT_ENROLL_TIMEOUT_MS } from '../../src/data/participantData';

/**
 * One-time shared setup: seeds the participant pool via UI (mass "Enroll test users")
 * and caches it in `.cache/participant-pool.json`. Idempotent — no-ops if the cache
 * already exists. UI and API projects depend on this so specs never seed inline.
 */
setup('seed participant pool', async ({ page, request }) => {
  setup.setTimeout(PARTICIPANT_ENROLL_TIMEOUT_MS + 60_000);

  const api = await authenticateApi(request);
  await api.participants.seedPool(page);
});
