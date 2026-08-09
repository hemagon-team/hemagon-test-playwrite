import type { APIRequestContext } from '@playwright/test';
import { endpoints } from '../data/endpoints';
import {
  buildNominationPayload,
  type NominationApiPayload,
} from '../data/nominationData';
import { assertOk } from '../helpers/http';
import { deleteResource, type CleanupResult } from '../helpers/cleanup';
import {
  NominationApiResponseSchema,
  type NominationApiResponse,
} from '../schemas/nomination.schema';
import { TournamentApiResponseSchema } from '../schemas/tournament.schema';

export class NominationFactory {
  constructor(
    private readonly api: APIRequestContext,
    private readonly authHeaders: Record<string, string>,
  ) {}

  async create(
    tournamentId: string,
    overrides: Partial<NominationApiPayload> = {},
  ): Promise<NominationApiResponse> {
    const res = await this.api.post(endpoints.nominations.base, {
      data:    buildNominationPayload(tournamentId, overrides),
      headers: this.authHeaders,
    });

    await assertOk(res, `POST ${endpoints.nominations.base}`);
    return NominationApiResponseSchema.parse(await res.json());
  }

  async get(nominationId: string): Promise<NominationApiResponse> {
    const path = endpoints.nominations.byId(nominationId);
    const res  = await this.api.get(path, { headers: this.authHeaders });

    await assertOk(res, `GET ${path}`);
    return NominationApiResponseSchema.parse(await res.json());
  }

  async delete(nominationId: string): Promise<CleanupResult<string>> {
    return deleteResource(
      this.api,
      endpoints.nominations.byId(nominationId),
      this.authHeaders,
      nominationId,
      `deleteNomination(${nominationId})`,
    );
  }

  /**
   * No `GET /organizer/nominations` list endpoint exists (returns 404), so the
   * ids are read from the tournament document's embedded `nominations` array.
   */
  async deleteAllForTournament(tournamentId: string): Promise<CleanupResult<string>[]> {
    const path = endpoints.tournaments.byId(tournamentId);
    const res  = await this.api.get(path, { headers: this.authHeaders });

    if (!res.ok()) {
      return [{ ok: false, key: tournamentId, attempts: 1, lastBody: await res.text() }];
    }

    const tournament = TournamentApiResponseSchema.parse(await res.json());
    const results: CleanupResult<string>[] = [];

    for (const nominationId of extractNominationIds(tournament.nominations)) {
      results.push(await this.delete(nominationId));
    }

    return results;
  }
}

function extractNominationIds(nominations: unknown[] | undefined): string[] {
  if (!nominations?.length) return [];

  return nominations
    .map(item => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null && '_id' in item) {
        return String((item as { _id: string })._id);
      }
      return null;
    })
    .filter((id): id is string => Boolean(id));
}
