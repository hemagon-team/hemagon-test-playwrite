import { expect, type Locator } from '@playwright/test';
import { TIMEOUTS } from '../../../data/config';
import { standingsTableSelectors } from '../../selectors';

/**
 * One standings row. Hemagon renders the same table in three places with slightly
 * different columns — the organizer stage card and the public "Rating" tab carry
 * Match Points / Coef., while public "Final standings" carries Pts lost instead.
 */
export interface StandingsRow {
  rank:          number;
  name:          string;
  fights:        number;
  wins:          number;
  losses:        number;
  draws:         number;
  techLosses:    number;
  pointsEarned:  number;
  matchPoints?:  number;
  coef?:         number;
  pointsLost?:   number;
}

interface RawRow {
  rank:  string;
  name:  string;
  cells: Record<string, string>;
}

interface RawTable {
  headers: string[];
  rows:    RawRow[];
}

type ColumnKey = keyof typeof COLUMNS;

const COLUMNS = {
  fights:       standingsTableSelectors.fightsColumn,
  wins:         standingsTableSelectors.winsColumn,
  losses:       standingsTableSelectors.lossesColumn,
  draws:        standingsTableSelectors.drawsColumn,
  techLosses:   standingsTableSelectors.techLossesColumn,
  pointsEarned: standingsTableSelectors.pointsEarnedColumn,
  matchPoints:  standingsTableSelectors.matchPointsColumn,
  coef:         standingsTableSelectors.coefColumn,
  pointsLost:   standingsTableSelectors.pointsLostColumn,
} as const;

const REQUIRED: ColumnKey[] = [
  'fights', 'wins', 'losses', 'draws', 'techLosses', 'pointsEarned',
];

/** Standings table shared by the organizer rating panel and both public views. */
export class StandingsTableSection {
  constructor(
    private readonly table: Locator,
    private readonly label: string,
  ) {}

  async expectLoaded(): Promise<void> {
    await expect(this.table, `${this.label}: standings table must render`)
      .toBeVisible({ timeout: TIMEOUTS.long });
  }

  async expectHidden(): Promise<void> {
    await expect(this.table, `${this.label}: standings table must be dismissed`)
      .toBeHidden({ timeout: TIMEOUTS.short });
  }

  async isVisible(): Promise<boolean> {
    return this.table.isVisible();
  }

  async rows(): Promise<StandingsRow[]> {
    await this.expectLoaded();

    const table = await this.table.evaluate((el): RawTable => {
      const headers = [...el.querySelectorAll('thead th')]
        .map(th => (th.textContent ?? '').trim());

      const rows = [...el.querySelectorAll('tbody tr')].map(tr => {
        const cells    = [...tr.querySelectorAll('td')];
        const nameCell = tr.querySelector('td.name') ?? cells[1];

        let name = '';
        if (nameCell) {
          const clone = nameCell.cloneNode(true) as HTMLElement;
          clone.querySelectorAll('.club').forEach(club => club.remove());
          name = (clone.textContent ?? '').trim();
        }

        const byHeader: Record<string, string> = {};
        cells.forEach((cell, index) => {
          const header = headers[index];
          if (header) byHeader[header] = (cell.textContent ?? '').trim();
        });

        return { rank: (cells[0]?.textContent ?? '').trim(), name, cells: byHeader };
      });

      return { headers, rows };
    });

    const present = this.presentColumns(table.headers);

    for (const column of REQUIRED) {
      expect(
        present.has(column),
        `${this.label}: table has no ${column} column`,
      ).toBe(true);
    }

    return table.rows.map((row, index) => this.toRow(row, index, present));
  }

  /** Row count without parsing every cell — cheap sanity check. */
  async rowCount(): Promise<number> {
    await this.expectLoaded();
    return this.table.locator('tbody tr').count();
  }

  /**
   * Which columns this view renders, read from the header row. Deriving presence from
   * headers rather than from cell contents keeps it uniform across rows, so callers
   * can treat an `undefined` field as "this view has no such column".
   */
  private presentColumns(headers: string[]): Set<ColumnKey> {
    const present = new Set<ColumnKey>();

    for (const [column, pattern] of Object.entries(COLUMNS) as [ColumnKey, RegExp][]) {
      if (headers.some(header => pattern.test(header))) present.add(column);
    }
    return present;
  }

  private toRow(raw: RawRow, index: number, present: Set<ColumnKey>): StandingsRow {
    const value = (column: ColumnKey): number | undefined => {
      if (!present.has(column)) return undefined;

      const pattern = COLUMNS[column];
      const entry   = Object.entries(raw.cells).find(([header]) => pattern.test(header));
      const parsed  = Number.parseInt(entry?.[1] ?? '', 10);

      expect(
        Number.isNaN(parsed),
        `${this.label}: row ${index + 1} has an unreadable ${column} cell`,
      ).toBe(false);

      return parsed;
    };

    return {
      rank:         Number.parseInt(raw.rank, 10),
      name:         raw.name,
      fights:       value('fights')!,
      wins:         value('wins')!,
      losses:       value('losses')!,
      draws:        value('draws')!,
      techLosses:   value('techLosses')!,
      pointsEarned: value('pointsEarned')!,
      matchPoints:  value('matchPoints'),
      coef:         value('coef'),
      pointsLost:   value('pointsLost'),
    };
  }
}
