import { expect, type Locator, type Page } from '@playwright/test';
import { TIMEOUTS } from '../../../../data/config';
import { nominationStagesSelectors } from '../../../selectors';
import { NominationPoolPage } from '../../../pages/NominationPoolPage';
import { expandStagePoolIfNeeded, poolCardAt } from '../stageCardScope';

/** Single round/pool card on a saved stage (Swiss round or POOL sub-card). */
export class StageCardRoundSection {
  private readonly round: Locator;
  private readonly poolRun: Locator;

  constructor(
    card: Locator,
    private readonly page: Page,
    private readonly stageIndex: number,
    private readonly poolIndex: number,
  ) {
    this.round   = card.locator(nominationStagesSelectors.stageRoundCard).nth(poolIndex);
    this.poolRun = page.locator(
      nominationStagesSelectors.poolRunButton(stageIndex, poolIndex),
    );
  }

  async expectLoaded(): Promise<void> {
    await expect(this.round).toBeVisible({ timeout: TIMEOUTS.short });
  }

  async expectUsersCount(count: number): Promise<void> {
    const usersBlock = this.round.locator('.fa-users').locator('..');
    await expect(usersBlock).toContainText(String(count), { timeout: TIMEOUTS.long });
  }

  /** Asserts fighter count on the pool card is within the standard 4–6 range. */
  async expectUsersCountInRange(min: number, max: number): Promise<void> {
    const usersBlock = this.round.locator('.fa-users').locator('..');
    const text       = await usersBlock.innerText();
    const match      = text.match(/\d+/);
    expect(match).not.toBeNull();

    const count = Number.parseInt(match![0], 10);
    expect(count).toBeGreaterThanOrEqual(min);
    expect(count).toBeLessThanOrEqual(max);
  }

  async expectFightCount(count: number): Promise<void> {
    const fightsBlock = this.round.locator('span', { hasText: '⚔' }).locator('..');
    await expect(fightsBlock).toContainText(String(count), { timeout: TIMEOUTS.long });
  }

  /** Opens the organizer pool conduct page (`/pools/:poolId`). */
  async run(): Promise<NominationPoolPage> {
    await expandStagePoolIfNeeded(this.page, this.stageIndex, this.poolRun);
    await expect(this.poolRun).toBeEnabled({ timeout: TIMEOUTS.long });

    const poolUrl = await this.poolRun.locator('xpath=ancestor::a[1]').getAttribute('href');
    expect(poolUrl).toBeTruthy();
    await this.page.goto(poolUrl!);

    const poolPage = new NominationPoolPage(this.page);
    await poolPage.expectLoaded();
    return poolPage;
  }

  async expectAllFightsDone(): Promise<void> {
    await expandStagePoolIfNeeded(this.page, this.stageIndex, this.poolRun);
    const poolCard = poolCardAt(this.page, this.stageIndex, this.poolIndex);
    await expect(
      poolCard.getByText(nominationStagesSelectors.poolAllFightsDoneLabel, { exact: true }),
    ).toBeVisible({ timeout: TIMEOUTS.long });
  }

  /**
   * Conduct shortcut: RUN → RND results (with confirm) → wait for fight PUTs →
   * return to stages and assert "All fights done" on this pool card.
   */
  async conductAndReturn(
    stagesOpen: () => Promise<void>,
    options: { minFightUpdates?: number } = {},
  ): Promise<number> {
    const poolPage = await this.run();
    const bouts    = await poolPage.fillRandomResults();

    if (options.minFightUpdates !== undefined) {
      expect(bouts).toBeGreaterThanOrEqual(options.minFightUpdates);
    }

    await stagesOpen();
    await this.expectAllFightsDone();
    return bouts;
  }
}
