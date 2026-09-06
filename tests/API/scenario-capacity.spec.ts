import { test, expect } from '@playwright/test';
import {
  listPoolsDoubleEliminationScenarios,
  listPoolsEliminationScenarios,
  listSwissScenarios,
} from '../../src/helpers/loadScenario';
import { loadParticipantPool } from '../../src/helpers/participantPoolStorage';

/**
 * The environment caps how many test users a single nomination can enroll, so the
 * shared pool can come back smaller than requested. Without this guard, an undersized
 * pool only surfaces minutes into the largest UI scenario as "Requested N but pool has
 * only M" — here it fails in milliseconds.
 */
test.describe('Scenario capacity', () => {
  test('the shared participant pool covers the largest scenario roster', () => {
    const rosters = [
      ...listPoolsEliminationScenarios(),
      ...listPoolsDoubleEliminationScenarios(),
      ...listSwissScenarios(),
    ].map(scenario => ({ id: scenario.id, size: scenario.participantsNumber }));

    expect(rosters.length, 'scenario matrices must not be empty').toBeGreaterThan(0);

    const largest = rosters.reduce((max, entry) => (entry.size > max.size ? entry : max));
    const pool    = loadParticipantPool();

    expect(pool, 'pool-setup must have cached the shared participant pool').not.toBeNull();
    expect(
      pool!.participants.length,
      `scenario ${largest.id} enrolls ${largest.size} fighters from the shared pool`,
    ).toBeGreaterThanOrEqual(largest.size);
  });
});
