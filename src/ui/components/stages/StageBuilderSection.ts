import type { DoubleElimFinalsMode } from '../../../data/doubleElimData';
import { StageType, type StageTypeCode, type TillFinalsOption } from '../../../data/nominationStageData';
import type { NominationStagesCardsSection } from './NominationStagesCardsSection';
import type { StageAddFormSection } from './StageAddFormSection';
import type { StageCardSection } from './card/StageCardSection';

interface CommonStageOptions {
  /** Per-fight duration in seconds. */
  fightTime?: number;
}

export interface PoolStageOptions extends CommonStageOptions {
  /** Lift the 7-fighter-per-pool cap (affects manual capacity, not auto-seed). */
  unlimited?: boolean;
}

export interface EliminationStageOptions extends CommonStageOptions {
  /** "Hold a fight for the third place" (bronze fight); the product default is true. */
  thirdPlace?: boolean;
}

export interface SwissStageOptions extends CommonStageOptions {
  tillFinals?: TillFinalsOption;
}

export interface DoubleEliminationStageOptions extends CommonStageOptions {
  tillFinals?:  TillFinalsOption;
  finalsMode?:  DoubleElimFinalsMode;
}

/**
 * Fluent helper for building stages step by step in UI tests. Each method opens the
 * add form, applies type-specific options, saves, and returns the new {@link StageCardSection}
 * so follow-up actions (seed pools, set "goes next stage", enroll, assert) read in the same
 * order an organizer performs them. Thin wrapper over the add form + saved-cards sections.
 */
export class StageBuilderSection {
  constructor(
    private readonly cards: NominationStagesCardsSection,
    private readonly form:  StageAddFormSection,
  ) {}

  async pool(options: PoolStageOptions = {}): Promise<StageCardSection> {
    return this.create(StageType.Pool, async () => {
      if (options.fightTime !== undefined) await this.form.common.setFightTime(options.fightTime);
      if (options.unlimited !== undefined) await this.form.pool.setUnlimitedPool(options.unlimited);
    });
  }

  async elimination(options: EliminationStageOptions = {}): Promise<StageCardSection> {
    return this.create(StageType.Elimination, async () => {
      if (options.fightTime !== undefined)  await this.form.common.setFightTime(options.fightTime);
      if (options.thirdPlace !== undefined) await this.form.elimination.setFightForThirdPlace(options.thirdPlace);
    });
  }

  async swiss(options: SwissStageOptions = {}): Promise<StageCardSection> {
    return this.create(StageType.Swiss, async () => {
      if (options.fightTime !== undefined)  await this.form.common.setFightTime(options.fightTime);
      if (options.tillFinals !== undefined) await this.form.common.setTillFinals(options.tillFinals);
    });
  }

  async doubleElimination(options: DoubleEliminationStageOptions = {}): Promise<StageCardSection> {
    return this.create(StageType.DoubleElimination, async () => {
      if (options.fightTime !== undefined)  await this.form.common.setFightTime(options.fightTime);
      if (options.tillFinals !== undefined) await this.form.common.setTillFinals(options.tillFinals);
      if (options.finalsMode !== undefined) await this.form.doubleElimination.setFinalsMode(options.finalsMode);
      await this.form.doubleElimination.expectLoaded();
    });
  }

  /** Shared sequence: open form → pick type → type-specific config → save → return the new card. */
  private async create(
    type: StageTypeCode,
    configure: () => Promise<void>,
  ): Promise<StageCardSection> {
    // New stage is appended, so its positional index equals the pre-add card count.
    const index = await this.cards.count();

    await this.cards.openAddForm();
    await this.form.expectLoaded();
    await this.form.type.selectType(type);
    await configure();
    await this.form.actions.save();

    await this.cards.expectCount(index + 1);
    const card = this.cards.cardAt(index);
    await card.expectLoaded();
    return card;
  }
}
