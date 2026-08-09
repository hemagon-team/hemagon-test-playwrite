import type { APIRequestContext } from '@playwright/test';
import { endpoints } from '../data/endpoints';
import { buildRingPayload, DEFAULT_RING_TITLE } from '../data/ringData';
import { assertOk } from '../helpers/http';
import { deleteResource, type CleanupResult } from '../helpers/cleanup';
import {
  RingApiResponseSchema,
  RingListResponseSchema,
  type RingApiResponse,
} from '../schemas/ring.schema';

export class RingFactory {
  constructor(
    private readonly api: APIRequestContext,
    private readonly authHeaders: Record<string, string>,
  ) {}

  async create(
    tournamentId: string,
    title: string = DEFAULT_RING_TITLE,
  ): Promise<RingApiResponse> {
    const res = await this.api.post(endpoints.areas.base, {
      data:    buildRingPayload(tournamentId, title),
      headers: this.authHeaders,
    });

    await assertOk(res, `POST ${endpoints.areas.base}`);
    return RingApiResponseSchema.parse(await res.json());
  }

  async list(tournamentId: string): Promise<RingApiResponse[]> {
    const path = endpoints.areas.listForTournament(tournamentId);
    const res  = await this.api.get(path, { headers: this.authHeaders });

    await assertOk(res, `GET ${path}`);
    return RingListResponseSchema.parse(await res.json()).items;
  }

  async delete(ringId: string): Promise<CleanupResult<string>> {
    return deleteResource(
      this.api,
      endpoints.areas.byId(ringId),
      this.authHeaders,
      ringId,
      `deleteRing(${ringId})`,
    );
  }

  async deleteAllForTournament(tournamentId: string): Promise<CleanupResult<string>[]> {
    const rings   = await this.list(tournamentId).catch(() => []);
    const results: CleanupResult<string>[] = [];

    for (const ring of rings) {
      results.push(await this.delete(ring._id));
    }

    return results;
  }
}
