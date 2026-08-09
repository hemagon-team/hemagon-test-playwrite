import { expect, type Page } from '@playwright/test';
import { TIMEOUTS } from '../../data/config';
import { endpoints } from '../../data/endpoints';
import { submitAndCapture } from '../../helpers/uiCapture';
import { RingApiResponseSchema, type RingApiResponse } from '../../schemas/ring.schema';
import { TournamentRingsSection } from '../components/TournamentRingsSection';

export class TournamentAreasPage {
  readonly rings: TournamentRingsSection;

  constructor(private readonly page: Page) {
    this.rings = new TournamentRingsSection(page);
  }

  async open(tournamentId: string): Promise<void> {
    await this.page.goto(`/organizer/tournaments/${tournamentId}/areas`);
    await this.expectLoaded(tournamentId);
  }

  async expectLoaded(tournamentId?: string): Promise<void> {
    if (tournamentId) {
      await this.page.waitForURL(new RegExp(`/organizer/tournaments/${tournamentId}/areas(?:$|\\?)`), {
        timeout: TIMEOUTS.long,
      });
    } else {
      await expect(this.page).toHaveURL(/\/organizer\/tournaments\/[a-f0-9]+\/areas(?:$|\?)/, {
        timeout: TIMEOUTS.long,
      });
    }

    await this.rings.expectLoaded();
  }

  async createRing(title: string): Promise<RingApiResponse> {
    return submitAndCapture(
      this.page,
      endpoints.areas.base,
      () => this.rings.createRing(title),
      RingApiResponseSchema,
    );
  }

  /** Creates a ring via UI and asserts it appears on the areas page. */
  async createAndExpectRing(title: string): Promise<RingApiResponse> {
    const ring = await this.createRing(title);
    await this.rings.expectRingVisible(title);
    return ring;
  }
}
