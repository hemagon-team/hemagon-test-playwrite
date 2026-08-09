import type { TestInfo } from '@playwright/test';
import type { AuthenticatedApi } from './apiAuth.fixture';
import { reportCleanupFailure, type CleanupResult } from '../helpers/cleanup';

type CleanupAction = () => Promise<CleanupResult<string> | CleanupResult<string>[]>;

/**
 * Registers created resources and tears them down in reverse creation order.
 * Cleanup failures are attached to the Allure report instead of failing the test.
 */
export class ResourceTracker {
  private readonly actions: CleanupAction[] = [];

  constructor(private readonly api: AuthenticatedApi) {}

  /** Register an arbitrary cleanup; runs LIFO during teardown. */
  add(action: CleanupAction): void {
    this.actions.push(action);
  }

  /** Track a tournament: deletes nominations, rings, then the tournament itself. */
  tournament(tournamentId: string): void {
    this.add(async () => [
      ...await this.api.nominations.deleteAllForTournament(tournamentId),
      ...await this.api.rings.deleteAllForTournament(tournamentId),
      await this.api.tournaments.delete(tournamentId),
    ]);
  }

  /** Track a single nomination (category) for deletion. */
  nomination(nominationId: string): void {
    this.add(async () => this.api.nominations.delete(nominationId));
  }

  /** Track a single ring for deletion. */
  ring(ringId: string): void {
    this.add(async () => this.api.rings.delete(ringId));
  }

  async cleanup(testInfo: TestInfo): Promise<void> {
    const pending = [...this.actions].reverse();
    this.actions.length = 0;

    for (const action of pending) {
      for (const result of await runSafely(action)) {
        await reportCleanupFailure(testInfo, result);
      }
    }
  }
}

async function runSafely(action: CleanupAction): Promise<CleanupResult<string>[]> {
  try {
    const result = await action();
    return Array.isArray(result) ? result : [result];
  } catch (error) {
    return [{ ok: false, key: 'unknown', attempts: 0, lastBody: String(error) }];
  }
}
