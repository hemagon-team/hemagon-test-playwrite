import { type Page } from '@playwright/test';
import { TIMEOUTS } from '../../data/config';
import { TournamentStatusSection } from '../components/TournamentStatusSection';

export class TournamentOverviewPage {
  readonly status: TournamentStatusSection;

  constructor(private readonly page: Page) {
    this.status = new TournamentStatusSection(page);
  }

  async open(tournamentId: string): Promise<void> {
    await this.page.goto(`/organizer/tournaments/${tournamentId}`);
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await this.page.waitForURL(/\/organizer\/tournaments\/[a-f0-9]+(?:$|\?)/, {
      timeout: TIMEOUTS.long,
    });
    await this.status.expectLoaded();
  }

  async reload(): Promise<void> {
    await this.page.reload();
    await this.expectLoaded();
  }
}
