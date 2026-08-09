import { expect, type Locator, type Page } from '@playwright/test';
import { TIMEOUTS } from '../../data/config';
import { nominationPublicSelectors } from '../selectors';
import { StandingsTableSection } from '../components/standings/StandingsTableSection';

/** Elimination bracket on the public nomination page. */
export class NominationPublicEliminationSection {
  constructor(private readonly page: Page) {}

  private heading(): Locator {
    return this.page.getByRole('heading', { name: nominationPublicSelectors.eliminationStageTitle });
  }

  private bracketRoot(): Locator {
    return this.heading().locator('xpath=following-sibling::*[1]');
  }

  async ensureExpanded(): Promise<void> {
    const heading = this.heading();
    await expect(heading).toBeVisible({ timeout: TIMEOUTS.long });

    if (await this.bracketRoot().isVisible()) return;

    await heading.getByRole('button').click();
    await expect(this.bracketRoot()).toBeVisible({ timeout: TIMEOUTS.long });
  }

  /**
   * At least `minBouts` elimination scores are published on the public bracket
   * (seed/name/score rows — we only verify scores exist, not exact points).
   */
  async expectScoredBoutCount(minBouts: number): Promise<void> {
    await this.ensureExpanded();

    await expect.poll(async () => this.countScoredBouts(), {
      timeout: TIMEOUTS.long,
    }).toBeGreaterThanOrEqual(minBouts);
  }

  private async countScoredBouts(): Promise<number> {
    return this.bracketRoot().evaluate(el => {
      const lines: string[] = [];
      const walk = (node: Element) => {
        if (node.children.length === 0) {
          const text = node.textContent?.trim();
          if (text) lines.push(text);
          return;
        }
        for (const child of node.children) walk(child);
      };
      walk(el);

      let bouts = 0;
      let j     = 0;
      const isName  = (value: string) => value.length > 0 && !/^\d+$/.test(value);
      const scored  = (a: string, b: string) => Number(a) > 0 || Number(b) > 0;

      while (j < lines.length) {
        if (j + 5 < lines.length) {
          const [seed1, name1, score1, seed2, name2, score2] = lines.slice(j, j + 6);

          const isSeededBout =
            /^\d+$/.test(seed1) && isName(name1) && /^\d+$/.test(score1)
            && /^\d+$/.test(seed2) && isName(name2) && /^\d+$/.test(score2);

          if (isSeededBout) {
            if (scored(score1, score2)) bouts++;
            j += 6;
            continue;
          }
        }

        if (j + 3 < lines.length) {
          const [name1, score1, name2, score2] = lines.slice(j, j + 4);

          const isUnseededBout =
            isName(name1) && /^\d+$/.test(score1)
            && isName(name2) && /^\d+$/.test(score2);

          if (isUnseededBout) {
            if (scored(score1, score2)) bouts++;
            j += 4;
            continue;
          }
        }

        j++;
      }

      return bouts;
    });
  }
}

/**
 * Swiss system block on the public bracket tab. Sub-tabs "Pools" (per-round fight
 * lists) and "Rating" (stage standings) sit under the "Swiss system" heading; the
 * round titles are the only "Round N" text on this route, so they scope cleanly.
 */
export class NominationPublicSwissSection {
  constructor(private readonly page: Page) {}

  async expectLoaded(): Promise<void> {
    await expect(this.page.getByText(nominationPublicSelectors.swissRatingTab, { exact: true }))
      .toBeVisible({ timeout: TIMEOUTS.long });
  }

  /**
   * Rounds 1…`rounds` are published and nothing beyond. Comparing the whole set of
   * numbers rather than a "no Round N+1" text probe keeps double-digit rounds honest
   * (`Round 1` is a substring of `Round 10`). Only the default "Pools" sub-tab renders
   * round titles, so call this before switching to "Rating".
   */
  async expectRoundCount(rounds: number): Promise<void> {
    await this.expectLoaded();

    const expected = Array.from({ length: rounds }, (_, index) => index + 1);

    await expect
      .poll(() => this.publishedRoundNumbers(), { timeout: TIMEOUTS.long })
      .toEqual(expected);
  }

  /**
   * Round numbers currently on screen. Read from rendered text rather than
   * `textContent`, which runs adjacent blocks together ("RatingRound 1") and hides the
   * titles from any word-boundary match.
   */
  private async publishedRoundNumbers(): Promise<number[]> {
    const text = await this.page.locator('body').innerText();
    const seen = new Set(
      [...text.matchAll(nominationPublicSelectors.swissRoundTitles)]
        .map(match => Number(match[1])),
    );

    return [...seen].sort((left, right) => left - right);
  }

  /** Switches to the "Rating" sub-tab and returns the standings table. */
  async openRating(): Promise<StandingsTableSection> {
    await this.expectLoaded();
    await this.page
      .getByText(nominationPublicSelectors.swissRatingTab, { exact: true })
      .first()
      .click();

    return openTheOnlyStandingsTable(this.page, 'public swiss rating');
  }
}

/**
 * Both public standings routes render a single table, so anything else means the page
 * changed shape and picking the first one would silently read the wrong data.
 */
async function openTheOnlyStandingsTable(
  page: Page,
  label: string,
): Promise<StandingsTableSection> {
  const tables = page.locator('table');
  await expect(tables, `${label}: expected exactly one table on the page`)
    .toHaveCount(1, { timeout: TIMEOUTS.long });

  const standings = new StandingsTableSection(tables.first(), label);
  await standings.expectLoaded();
  return standings;
}

/** One pool standings table on the public nomination bracket page. */
export class NominationPublicPoolSection {
  constructor(private readonly table: Locator) {}

  private async fightsColumnIndex(): Promise<number> {
    const headers = this.table.locator('thead th');
    const count   = await headers.count();

    for (let i = 0; i < count; i++) {
      const label = (await headers.nth(i).innerText()).trim();
      if (/^Fights$/i.test(label)) return i;
    }

    throw new Error('Fights column not found in public pool table');
  }

  private async fightsCell(row: Locator): Promise<Locator> {
    const col = await this.fightsColumnIndex();
    return row.locator('td').nth(col);
  }

  /**
   * Asserts at least one participant row has Fights > 0 (random scores — we only
   * verify that results were published, not exact points).
   */
  async expectHasPlayedResults(): Promise<void> {
    const rows = this.table.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: TIMEOUTS.long });

    const rowCount = await rows.count();
    let played     = false;

    for (let i = 0; i < rowCount; i++) {
      const fightsText = await (await this.fightsCell(rows.nth(i))).innerText();
      if (Number.parseInt(fightsText.trim(), 10) > 0) {
        played = true;
        break;
      }
    }

    expect(played).toBe(true);
  }

  /** Every participant row still shows Fights = 0 (pool not conducted yet). */
  async expectNoResultsYet(): Promise<void> {
    const rows     = this.table.locator('tbody tr');
    const rowCount = await rows.count();
    expect(rowCount).toBeGreaterThan(0);

    for (let i = 0; i < rowCount; i++) {
      await expect(await this.fightsCell(rows.nth(i))).toHaveText('0');
    }
  }
}

/**
 * Public nomination bracket: `/tournament/:tournamentSlug/nomination/:nominationSlug`.
 */
export class NominationPublicPage {
  constructor(private readonly page: Page) {}

  async open(tournamentSlug: string, nominationSlug: string): Promise<void> {
    await this.page.goto(`/tournament/${tournamentSlug}/nomination/${nominationSlug}`);
    await this.expectLoaded();
  }

  async expectLoaded(): Promise<void> {
    await this.page.waitForURL(
      /\/tournament\/[^/]+\/nomination\/[^/]+(?:$|\?)/,
      { timeout: TIMEOUTS.long },
    );
    await expect(this.page.getByText(nominationPublicSelectors.bracketTab, { exact: true }))
      .toBeVisible({ timeout: TIMEOUTS.long });
  }

  /** Resolves the standings table that immediately follows the pool title heading. */
  pool(name: string): NominationPublicPoolSection {
    const table = this.page.locator(
      `xpath=//*[normalize-space(text())="${name}"]/following::table[1]`,
    );
    return new NominationPublicPoolSection(table);
  }

  elimination(): NominationPublicEliminationSection {
    return new NominationPublicEliminationSection(this.page);
  }

  swiss(): NominationPublicSwissSection {
    return new NominationPublicSwissSection(this.page);
  }

  /** Top-level "Final standings" tab — its own route with the cross-stage table. */
  async openFinalStandings(): Promise<StandingsTableSection> {
    await this.page
      .getByText(nominationPublicSelectors.finalStandingsTab, { exact: true })
      .first()
      .click();
    await this.page.waitForURL(/\/final-standings(?:$|\?)/, { timeout: TIMEOUTS.long });

    return openTheOnlyStandingsTable(this.page, 'public final standings');
  }
}