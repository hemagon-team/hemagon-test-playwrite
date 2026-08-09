import type { APIRequestContext } from '@playwright/test';
import { endpoints } from '../data/endpoints';
import {
  buildTournamentPayload,
  type TournamentApiPayload,
} from '../data/tournamentData';
import {
  buildTournamentStateUpdatePayload,
  type TournamentStatusCode,
} from '../data/tournamentStatus';
import { assertOk } from '../helpers/http';
import { deleteResource, type CleanupResult } from '../helpers/cleanup';
import {
  TournamentApiResponseSchema,
  TournamentCreatedApiResponseSchema,
  TournamentListResponseSchema,
  tournamentApiResponseWithStateSchema,
  type TournamentApiResponse,
  type TournamentCreatedApiResponse,
} from '../schemas/tournament.schema';

export class TournamentFactory {
  constructor(
    private readonly api: APIRequestContext,
    private readonly authHeaders: Record<string, string>,
  ) {}

  /** Creates a tournament with Purpose: Testing (`test: true`) for participant setup in later steps. */
  async create(
    overrides: Partial<TournamentApiPayload> = {},
  ): Promise<TournamentCreatedApiResponse> {
    const res = await this.api.post(endpoints.tournaments.base, {
      data:    buildTournamentPayload(overrides),
      headers: this.authHeaders,
    });

    await assertOk(res, `POST ${endpoints.tournaments.base}`);
    return TournamentCreatedApiResponseSchema.parse(await res.json());
  }

  async setState(
    tournamentId: string,
    state: TournamentStatusCode,
  ): Promise<TournamentApiResponse> {
    const path = endpoints.tournaments.byId(tournamentId);
    const res  = await this.api.put(path, {
      data:    buildTournamentStateUpdatePayload(tournamentId, state),
      headers: this.authHeaders,
    });

    await assertOk(res, `PUT ${path}`);
    return tournamentApiResponseWithStateSchema(state).parse(await res.json());
  }

  async get(tournamentId: string): Promise<TournamentApiResponse> {
    const path = endpoints.tournaments.byId(tournamentId);
    const res  = await this.api.get(path, { headers: this.authHeaders });

    await assertOk(res, `GET ${path}`);
    return TournamentApiResponseSchema.parse(await res.json());
  }

  async list(): Promise<unknown[]> {
    const res = await this.api.get(endpoints.tournaments.base, { headers: this.authHeaders });

    await assertOk(res, `GET ${endpoints.tournaments.base}`);
    return TournamentListResponseSchema.parse(await res.json()).items;
  }

  async delete(tournamentId: string): Promise<CleanupResult<string>> {
    return deleteResource(
      this.api,
      endpoints.tournaments.byId(tournamentId),
      this.authHeaders,
      tournamentId,
      `deleteTournament(${tournamentId})`,
    );
  }
}
