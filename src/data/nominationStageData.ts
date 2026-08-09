/** Stage format values from `#input-stage-type-*` radios. */
export const StageType = {
  Pool:              'POOL',
  Elimination:       'ELIMINATION',
  DoubleElimination: 'ELIMINATION_DOUBLE',
  Swiss:             'SWISS',
  SwissHits:         'SWISS_HITS',
  PoolBoar:          'POOL_BOAR',
} as const;

export type StageTypeCode = typeof StageType[keyof typeof StageType];

/** "To the finals" radio group on the add-stage form. */
export type TillFinalsOption = 'yes' | 'no' | 'qualification';

/**
 * "From each pool surely goes to the next stage" radio group (Edit form, pool stages).
 * `'any'` means rating decides; `1`–`5` guarantee that many advance from every pool.
 */
export type MinimumFromEachPool = 'any' | 1 | 2 | 3 | 4 | 5;
