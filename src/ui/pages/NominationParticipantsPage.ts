import { type Page } from '@playwright/test';
import { TIMEOUTS } from '../../data/config';
import { NominationParticipantsSection } from '../components/NominationParticipantsSection';

export class NominationParticipantsPage {
  readonly participants: NominationParticipantsSection;

  constructor(private readonly page: Page) {
    this.participants = new NominationParticipantsSection(page);
  }

  async open(tournamentId: string, nominationId: string): Promise<void> {
    await this.page.goto(
      `/organizer/tournaments/${tournamentId}/nominations/${nominationId}/requests`,
    );
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await this.page.waitForURL(
      /\/organizer\/tournaments\/[a-f0-9]+\/nominations\/[a-f0-9]+\/requests(?:$|\?)/,
      { timeout: TIMEOUTS.long },
    );
    await this.participants.expectLoaded();
  }
}
