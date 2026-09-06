import { expect, type Locator } from '@playwright/test';
import { TIMEOUTS } from '../../../../data/config';
import { nominationStagesSelectors } from '../../../selectors';

/** `finals: true` — the round holds gold/bronze cards instead of `Round N, fight M` labels. */
export interface RoundOptions {
  finals?:     boolean;
  thirdPlace?: boolean;
}

/** ELIMINATION stage — bracket fights rendered on the saved stage card. */
export class StageCardEliminationBracketSection {
  constructor(
    private readonly card: Locator,
    private readonly ensureExpanded: (marker: Locator) => Promise<void>,
  ) {}

  private roundMarker(round: number): Locator {
    return this.card.getByText(nominationStagesSelectors.bracketRoundFightLabel(round)).first();
  }

  async expectLoaded(): Promise<void> {
    const marker = this.card.getByText('Round 1', { exact: false }).first();
    await this.ensureExpanded(marker);
    await expect(marker).toBeVisible({ timeout: TIMEOUTS.long });
  }

  /** Double Elimination — winner bracket section is rendered after build-next-stage. */
  async expectWinnerBracketLoaded(): Promise<void> {
    const marker = this.card.getByText(nominationStagesSelectors.winnerBracketLabel, { exact: true });
    await this.ensureExpanded(marker);
    await expect(marker).toBeVisible({ timeout: TIMEOUTS.long });
  }

  /** Double Elimination — winner-bracket round N fight cards (left + right halves). */
  async expectDoubleElimRoundFightCount(round: number, count: number): Promise<void> {
    await this.expectWinnerBracketLoaded();
    await expect(this.card.getByText(nominationStagesSelectors.doubleElimBracketFightLabel(round)))
      .toHaveCount(count, { timeout: TIMEOUTS.long });
  }

  /** Counts fights in a round that already show "All fights done". */
  async roundFightsDoneCount(round: number, options: RoundOptions = {}): Promise<number> {
    if (options.finals) {
      return this.finalsFightsDoneCount(round, options);
    }

    const labels = this.card.getByText(nominationStagesSelectors.bracketRoundFightLabel(round));
    const total  = await labels.count();
    let done     = 0;

    for (let i = 0; i < total; i++) {
      const fight = labels.nth(i).locator('xpath=ancestor::div[contains(@class,"card")][1]');
      if (await fight.getByText(nominationStagesSelectors.poolAllFightsDoneLabel, { exact: true }).isVisible()) {
        done++;
      }
    }

    return done;
  }

  /** Every fight in the round shows "All fights done" after RND results. */
  async expectRoundFightsHaveResults(
    round: number,
    count: number,
    options: RoundOptions = {},
  ): Promise<void> {
    if (options.finals) {
      await this.expectFinalsFightsHaveResults(round, count);
      return;
    }

    const marker = this.roundMarker(round);
    await this.ensureExpanded(marker);

    const labels = this.card.getByText(nominationStagesSelectors.bracketRoundFightLabel(round));
    await expect(labels).toHaveCount(count, { timeout: TIMEOUTS.long });

    for (let i = 0; i < count; i++) {
      const fight = labels.nth(i).locator('xpath=ancestor::div[contains(@class,"card")][1]');
      await expect(
        fight.getByText(nominationStagesSelectors.poolAllFightsDoneLabel, { exact: true }),
      ).toBeVisible({ timeout: TIMEOUTS.long });
    }
  }

  async expectRoundFightCount(
    round: number,
    count: number,
    options: RoundOptions = {},
  ): Promise<void> {
    if (options.finals) {
      await this.expectFinalsFightCount(round, count);
      return;
    }

    const marker = this.roundMarker(round);
    await this.ensureExpanded(marker);
    await expect(this.card.getByText(nominationStagesSelectors.bracketRoundFightLabel(round)))
      .toHaveCount(count, { timeout: TIMEOUTS.long });
  }

  /** Nearest ancestor with the exact `round` class token (not `rounds-container`). */
  private roundSection(round: number): Locator {
    return this.card
      .locator('.round-title', { hasText: new RegExp(`^Round ${round}$`) })
      .locator(
        'xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " round ")][1]',
      );
  }

  /** RND button for a round. Round 1 renders before any `.round` wrapper exists. */
  roundRndResultsButton(round: number): Locator {
    const rndButton = { name: nominationStagesSelectors.stageRndResultsLabel };

    return round === 1
      ? this.card.getByRole('button', rndButton).first()
      : this.roundSection(round).getByRole('button', rndButton);
  }

  async expectRoundTitle(round: number): Promise<void> {
    const marker = this.card.locator('.round-title', { hasText: new RegExp(`^Round ${round}$`) }).first();
    await this.ensureExpanded(marker);
    await expect(marker).toBeVisible({ timeout: TIMEOUTS.long });
  }

  /** Round exists but the opposite bracket side has not been built yet. */
  async expectSideRoundPending(round: number): Promise<void> {
    await this.expectRoundTitle(round);
    await expect(
      this.card.getByText(nominationStagesSelectors.eliminationSidePendingLabel, { exact: true }),
    ).toBeVisible({ timeout: TIMEOUTS.long });
  }

  private finalsFightCard(round: number, title: string): Locator {
    return this.roundSection(round)
      .getByText(title, { exact: true })
      .locator('xpath=ancestor::div[contains(@class,"pool")][1]');
  }

  /** Per-fight conduct link on the gold finals card (used when round RND is disabled). */
  goldFightRunLink(round: number): Locator {
    return this.finalsFightCard(round, nominationStagesSelectors.finalsGoldFightLabel)
      .getByRole('link', { name: 'Run' });
  }

  async expectFinalsFightCount(round: number, count: number): Promise<void> {
    await this.expectRoundTitle(round);

    await expect(
      this.finalsFightCard(round, nominationStagesSelectors.finalsGoldFightLabel),
    ).toBeVisible({ timeout: TIMEOUTS.long });

    const bronze = this.finalsFightCard(round, nominationStagesSelectors.finalsBronzeFightLabel);

    if (count >= 2) {
      await expect(bronze).toBeVisible({ timeout: TIMEOUTS.long });
    }
    // count === 1: bronze card may still render but is auto-resolved (BOTH_WIN) — not conducted.
  }

  /** Gold/bronze cards show "All fights done" after RND results. */
  async expectFinalsFightsHaveResults(round: number, count: number): Promise<void> {
    await this.expectRoundTitle(round);

    const titles = [
      nominationStagesSelectors.finalsGoldFightLabel,
      nominationStagesSelectors.finalsBronzeFightLabel,
    ].slice(0, count);

    for (const title of titles) {
      const fight = this.finalsFightCard(round, title);
      await expect(fight).toBeVisible({ timeout: TIMEOUTS.long });
      await expect(
        fight.getByText(nominationStagesSelectors.poolAllFightsDoneLabel, { exact: true }),
      ).toBeVisible({ timeout: TIMEOUTS.long });
    }
  }

  async finalsFightsDoneCount(round: number, options: RoundOptions = {}): Promise<number> {
    const titles = options.thirdPlace === false
      ? [nominationStagesSelectors.finalsGoldFightLabel]
      : [
          nominationStagesSelectors.finalsGoldFightLabel,
          nominationStagesSelectors.finalsBronzeFightLabel,
        ];
    let done = 0;

    for (const title of titles) {
      const fight = this.finalsFightCard(round, title);
      if (!(await fight.isVisible())) continue;

      if (await fight.getByText(nominationStagesSelectors.poolAllFightsDoneLabel, { exact: true }).isVisible()) {
        done++;
      }
    }

    return done;
  }
}
