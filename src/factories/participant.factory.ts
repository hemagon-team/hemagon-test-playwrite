import type { APIRequestContext, Page } from '@playwright/test';
import { endpoints } from '../data/endpoints';
import {
  buildParticipantRequestPayload,
  PARTICIPANT_ENROLL_STABLE_MS,
  PARTICIPANT_ENROLL_TIMEOUT_MS,
  PARTICIPANT_POOL_TARGET,
  toEnrolledParticipant,
  type EnrolledParticipant,
  type EnrollTestUsersOptions,
  type ParticipantPool,
} from '../data/participantData';
import { capturePostResponses } from '../helpers/capturePostResponses';
import { deleteResource, type CleanupResult } from '../helpers/cleanup';
import { assertOk } from '../helpers/http';
import {
  loadParticipantPool,
  saveParticipantPool,
  toParticipantPool,
} from '../helpers/participantPoolStorage';
import { autotestLabel } from '../helpers/randomCode';
import { waitForEnrollComplete } from '../helpers/waitForEnrollComplete';
import {
  ParticipantRequestApiResponseSchema,
  type ParticipantRequestApiResponse,
} from '../schemas/participant.schema';
import { NominationFactory } from './nomination.factory';
import { TournamentFactory } from './tournament.factory';
import { NominationParticipantsPage } from '../ui/pages/NominationParticipantsPage';
import { nominationParticipantsSelectors } from '../ui/selectors';

export class ParticipantFactory {
  constructor(
    private readonly api: APIRequestContext,
    private readonly authHeaders: Record<string, string>,
  ) {}

  /**
   * Registers pool users onto a nomination via `POST /organizer/requests` — API only,
   * no browser. The shared pool must already be seeded by the `pool-setup` project
   * (see {@link seedPool}); `paid`/`presence` are always `false` on this path.
   *
   * - On the pool nomination: returns the first `count` already-enrolled participants.
   * - On another nomination: registers `count` pool users via the API.
   */
  async enrollTestUsers(
    count: number,
    options: EnrollTestUsersOptions = {},
  ): Promise<EnrolledParticipant[]> {
    const pool = loadParticipantPool();
    if (!pool) {
      throw new Error(
        'Participant pool is not seeded. The "pool-setup" project must run first '
        + '(it populates .cache/participant-pool.json via UI).',
      );
    }

    const nominationId = options.nominationId ?? pool.nominationId;

    if (count > pool.participants.length) {
      throw new Error(
        `Requested ${count} participants but pool has only ${pool.participants.length}.`,
      );
    }

    const selected = pool.participants.slice(0, count);

    if (nominationId === pool.nominationId) {
      return selected.map(entry => ({ ...entry, paid: false, presence: false }));
    }

    const enrolled: EnrolledParticipant[] = [];
    for (const entry of selected) {
      const created = await this.create(nominationId, entry.userId);
      enrolled.push(toEnrolledParticipant(created, { paid: false, presence: false }));
    }

    return enrolled;
  }

  async create(
    nominationId: string,
    userId: string,
  ): Promise<ParticipantRequestApiResponse> {
    const res = await this.api.post(endpoints.requests.base, {
      data:    buildParticipantRequestPayload(nominationId, userId),
      headers: this.authHeaders,
    });

    await assertOk(res, `POST ${endpoints.requests.base}`);
    return ParticipantRequestApiResponseSchema.parse(await res.json());
  }

  async delete(requestId: string): Promise<CleanupResult<string>> {
    return deleteResource(
      this.api,
      endpoints.requests.byId(requestId),
      this.authHeaders,
      requestId,
      `deleteParticipantRequest(${requestId})`,
    );
  }

  async deleteAll(requestIds: readonly string[]): Promise<CleanupResult<string>[]> {
    const results: CleanupResult<string>[] = [];

    for (const requestId of [...requestIds].reverse()) {
      results.push(await this.delete(requestId));
    }

    return results;
  }

  /**
   * Seeds the shared user pool via UI (mass "Enroll test users") and caches it in
   * `.cache/participant-pool.json`. Idempotent: returns the cache if already present.
   * Called once by the `pool-setup` project; the only browser-dependent entry point.
   */
  async seedPool(page: Page): Promise<ParticipantPool> {
    const cached = loadParticipantPool();
    if (cached) return cached;

    const tournaments = new TournamentFactory(this.api, this.authHeaders);
    const nominations = new NominationFactory(this.api, this.authHeaders);

    const tournament = await tournaments.create({ title: autotestLabel('AUTOTEST Participant Pool') });
    const nomination = await nominations.create(tournament._id);
    const responses  = await this.seedPoolViaUi(page, tournament._id, nomination._id);

    if (responses.length < PARTICIPANT_POOL_TARGET) {
      console.warn(
        `Participant pool: requested ${PARTICIPANT_POOL_TARGET}, enrolled ${responses.length} `
        + '(stage test-user limit per nomination).',
      );
    }

    const pool = toParticipantPool(tournament._id, nomination._id, responses);
    saveParticipantPool(pool);

    return pool;
  }

  private async seedPoolViaUi(
    page: Page,
    tournamentId: string,
    nominationId: string,
  ): Promise<ParticipantRequestApiResponse[]> {
    const participantsPage = new NominationParticipantsPage(page);
    await participantsPage.open(tournamentId, nominationId);

    const responses = await capturePostResponses(
      page,
      endpoints.requests.base,
      async () => {
        await participantsPage.participants.setEnrollCount(PARTICIPANT_POOL_TARGET);
        await page.locator(nominationParticipantsSelectors.enrollTestUsersButton).click();
        await waitForEnrollComplete(page);
      },
      ParticipantRequestApiResponseSchema,
      {
        settleMs: PARTICIPANT_ENROLL_STABLE_MS,
        timeout:  PARTICIPANT_ENROLL_TIMEOUT_MS,
      },
    );

    if (!responses.length) {
      throw new Error(
        `UI enroll produced no POST ${endpoints.requests.base} responses for nomination ${nominationId}`,
      );
    }

    return responses;
  }
}
