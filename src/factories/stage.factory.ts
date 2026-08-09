import type { APIRequestContext } from '@playwright/test';
import { endpoints } from '../data/endpoints';
import { assertOk } from '../helpers/http';
import {
  StageListApiResponseSchema,
  type StageApiResponse,
} from '../schemas/stage.schema';

export class StageFactory {
  constructor(
    private readonly api: APIRequestContext,
    private readonly authHeaders: Record<string, string>,
  ) {}

  /** All stages of a nomination with pools, fighters and fight results. */
  async listForNomination(nominationId: string): Promise<StageApiResponse[]> {
    const path = endpoints.stages.listForNomination(nominationId);
    const res  = await this.api.get(path, { headers: this.authHeaders });

    await assertOk(res, `GET ${path}`);
    return StageListApiResponseSchema.parse(await res.json());
  }

  /** The single stage of `type` in a nomination (e.g. POOL, ELIMINATION). */
  async getByType(nominationId: string, type: string): Promise<StageApiResponse> {
    const stages = await this.listForNomination(nominationId);
    const stage  = stages.find(s => s.type === type);

    if (!stage) {
      throw new Error(
        `Stage of type ${type} not found in nomination ${nominationId} `
        + `(found: ${stages.map(s => s.type).join(', ') || 'none'})`,
      );
    }
    return stage;
  }
}
