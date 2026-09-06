import { expect, type Locator, type Page } from '@playwright/test';
import { TIMEOUTS } from '../../../../data/config';
import { endpoints } from '../../../../data/endpoints';
import { POOL_RND_RESULTS_TIMEOUT_MS } from '../../../../data/poolData';
import type { MinimumFromEachPool } from '../../../../data/nominationStageData';
import { nominationStagesSelectors } from '../../../selectors';
import { StageEditFormSection } from '../StageEditFormSection';
import { expandStagePoolIfNeeded, stageCardAt, stageCollapseToggle, stageOuterCardAt } from '../stageCardScope';
import { StageCardEliminationBracketSection, type RoundOptions } from './StageCardEliminationBracketSection';
import { NominationPoolPage } from '../../../pages/NominationPoolPage';
import { StageCardParticipantsSection } from './StageCardParticipantsSection';
import { StageCardPoolActionsSection } from './StageCardPoolActionsSection';
import { StageCardRatingSection } from './StageCardRatingSection';
import { StageCardRoundsSection } from './StageCardRoundsSection';
import { StageCardSettingsSection } from './StageCardSettingsSection';
import { StageCardToolbarSection } from './StageCardToolbarSection';

export class StageCardSection {
  readonly toolbar:      StageCardToolbarSection;
  readonly settings:     StageCardSettingsSection;
  readonly participants: StageCardParticipantsSection;
  readonly rounds:       StageCardRoundsSection;
  readonly pools:        StageCardPoolActionsSection;
  readonly bracket:      StageCardEliminationBracketSection;
  readonly rating:       StageCardRatingSection;

  private readonly card: Locator;

  constructor(
    private readonly page: Page,
    readonly index: number,
  ) {
    this.card = stageCardAt(page, index);

    this.toolbar      = new StageCardToolbarSection(page, this.card, index);
    this.settings     = new StageCardSettingsSection(this.card);
    this.participants = new StageCardParticipantsSection(stageOuterCardAt(page, index));
    this.rounds       = new StageCardRoundsSection(this.card, page, index);
    this.pools        = new StageCardPoolActionsSection(this.card, index);
    this.bracket      = new StageCardEliminationBracketSection(
      this.card,
      marker => this.ensureExpanded(marker),
    );
    this.rating       = new StageCardRatingSection(page, index);
  }

  async expectLoaded(): Promise<void> {
    await expect(this.card).toBeVisible({ timeout: TIMEOUTS.long });
    await this.toolbar.expectLoaded();
    await this.settings.expectLoaded();
  }

  async expectTitle(title: string | RegExp): Promise<void> {
    await expect(this.card.locator('.h3')).toHaveText(title);
  }

  /** Expands a collapsed stage card so rounds/bracket content is visible. */
  async ensureExpanded(contentMarker: Locator): Promise<void> {
    if (await contentMarker.isVisible()) return;

    const toggle = stageCollapseToggle(this.page, this.index);
    await expect(toggle).toBeVisible({ timeout: TIMEOUTS.short });
    await toggle.click();

    if (!(await contentMarker.isVisible())) {
      await toggle.click();
    }

    await expect(contentMarker).toBeVisible({ timeout: TIMEOUTS.long });
  }

  /** "Enroll all" is a stage-level action (`#btn-stage-{n}-enroll-all`). */
  async enrollAll(): Promise<void> {
    const button = this.page.locator(nominationStagesSelectors.stageEnrollAllButton(this.index));
    await expect(button).toBeVisible({ timeout: TIMEOUTS.short });
    await button.click();
  }

  /**
   * Sets how many fighters advance to the next stage via the Edit form. The
   * "Goes next stage" field only exists once a later stage has been added, so call
   * this after the following stage is created.
   */
  async goesNextStage(
    count: number,
    options: { minFromPool?: MinimumFromEachPool } = {},
  ): Promise<void> {
    const editForm = new StageEditFormSection(this.page);

    await this.toolbar.clickEdit();
    await editForm.expectLoaded();
    await editForm.setOutputCount(count);
    if (options.minFromPool !== undefined) {
      await editForm.setMinimumFromEachPool(options.minFromPool);
    }
    await editForm.save();

    await this.settings.expectGoesNextStage(count);
  }

  /** Every enrolled fighter advances — `goes next stage` equals the roster size. */
  async goesNextStageAll(rosterSize: number): Promise<void> {
    await this.goesNextStage(rosterSize);
  }

  /**
   * POOL stage — runs every pool (RUN → RND results) and returns to the stages page
   * after each, asserting "All fights done" on the card.
   * When `boutsPerPool` is omitted, each pool is conducted without a fixed bout minimum
   * (supports uneven seed distribution).
   */
  async conductAllPools(
    reopenStages: () => Promise<void>,
    poolCount: number,
    boutsPerPool?: number,
  ): Promise<void> {
    await expandStagePoolIfNeeded(
      this.page,
      this.index,
      this.page.locator(nominationStagesSelectors.poolRunButton(this.index, 0)),
    );

    const conductOptions = boutsPerPool !== undefined
      ? { minFightUpdates: boutsPerPool }
      : {};

    for (let i = 0; i < poolCount; i++) {
      await this.rounds.roundAt(i).conductAndReturn(reopenStages, conductOptions);
    }
  }

  /**
   * POOL stage — after all pools are conducted, builds the elimination bracket on the
   * next stage from pool standings (`POST /organizer/stages/build-next-stage`).
   */
  async buildNextStage(): Promise<void> {
    const button = this.page.locator(
      nominationStagesSelectors.buildNextStageButton(this.index),
    );
    await expect(button).toBeEnabled({ timeout: TIMEOUTS.long });

    const responsePromise = this.page.waitForResponse(
      response =>
        response.request().method() === 'POST'
        && response.url().includes(endpoints.stages.buildNextStage)
        && response.ok(),
      { timeout: TIMEOUTS.long },
    );

    await button.click();
    await responsePromise;
  }

  /**
   * SWISS — appends the next round paired from current standings
   * (`POST /organizer/stages/build-next-round-swiss`, body `{ stage }`).
   * The button is rendered only once the current round reports "All fights done",
   * so its absence is the product's own guard against building too early.
   */
  async buildNextSwissRound(): Promise<void> {
    const button = this.page
      .locator(nominationStagesSelectors.buildNextSwissRoundButton(this.index))
      .last();
    await expect(button).toBeEnabled({ timeout: TIMEOUTS.long });

    const responsePromise = this.page.waitForResponse(
      response =>
        response.request().method() === 'POST'
        && response.url().includes(endpoints.stages.buildNextRoundSwiss)
        && response.ok(),
      { timeout: TIMEOUTS.long },
    );

    await button.scrollIntoViewIfNeeded();
    await button.click();
    await responsePromise;
  }

  /**
   * ELIMINATION stage — fills every bout in `round` via that round's "RND results"
   * (native confirm dialog → parallel PUT /organizer/fights).
   * Pass `finals: true` for the gold/bronze round.
   */
  async fillRandomResults(
    round: number,
    minFightUpdates: number,
    options: RoundOptions = {},
  ): Promise<number> {
    await this.bracket.expectRoundTitle(round);

    const rndButton = this.bracket.roundRndResultsButton(round);

    await expect(rndButton).toBeEnabled({ timeout: TIMEOUTS.short });
    await Promise.all([
      this.page.waitForEvent('dialog').then(d => d.accept()),
      rndButton.click(),
    ]);

    await expect.poll(
      () => this.bracket.roundFightsDoneCount(round, options),
      { timeout: POOL_RND_RESULTS_TIMEOUT_MS },
    ).toBeGreaterThanOrEqual(minFightUpdates);

    return this.bracket.roundFightsDoneCount(round, options);
  }

  /**
   * ELIMINATION finals with thirdPlace off — round RND stays disabled; conduct the
   * gold fight via its per-fight Run link (same pool conduct page as POOL stage).
   */
  async conductFinalsGoldFight(
    round: number,
    reopenStages: () => Promise<void>,
  ): Promise<void> {
    await this.bracket.expectRoundTitle(round);

    const runLink = this.bracket.goldFightRunLink(round);
    await expect(runLink).toBeVisible({ timeout: TIMEOUTS.short });

    const poolUrl = await runLink.getAttribute('href');
    expect(poolUrl).toBeTruthy();
    await this.page.goto(poolUrl!);

    const poolPage = new NominationPoolPage(this.page);
    await poolPage.expectLoaded();
    await poolPage.fillRandomResults();

    await reopenStages();
    await this.bracket.expectRoundTitle(round);
    await this.bracket.expectFinalsFightsHaveResults(round, 1);
  }

  /**
   * ELIMINATION — after a side's current round is conducted, builds the next round
   * for that side (`POST /organizer/stages/build-next-round-elimination`).
   */
  async buildNextSideRound(sideIndex: number): Promise<void> {
    await this.clickBuildRoundButton(
      nominationStagesSelectors.buildNextSideRoundButton(this.index, sideIndex),
    );
  }

  /**
   * ELIMINATION — after both semi-finals are done, builds gold/bronze finals
   * (`POST /organizer/stages/build-next-round-elimination`, body `{ round: 1 }`).
   */
  async buildFinals(): Promise<void> {
    await this.clickBuildRoundButton(
      nominationStagesSelectors.buildFinalsButton(this.index),
    );
  }

  /**
   * DOUBLE ELIMINATION — advance winner/loser brackets to the next round
   * (`POST /organizer/stages/build-next-round-elimination`). Shares the build-finals
   * button id; only the enabled copy for the current round is clicked.
   */
  async buildNextEliminationRound(): Promise<void> {
    await this.buildFinals();
  }

  /**
   * Duplicate build-button ids exist per round block; only the current round's copy
   * is enabled, so we take the last enabled match and await the build-round POST.
   */
  private async clickBuildRoundButton(selector: string): Promise<void> {
    await this.bracket.expectLoaded();

    const button = this.page
      .locator(selector)
      .and(this.page.locator('button:not([disabled])'))
      .last();
    await expect(button).toBeEnabled({ timeout: TIMEOUTS.long });

    const responsePromise = this.page.waitForResponse(
      response =>
        response.request().method() === 'POST'
        && response.url().includes(endpoints.stages.buildNextRoundElimination)
        && response.ok(),
      { timeout: TIMEOUTS.long },
    );

    await button.click();
    await responsePromise;
  }
}
