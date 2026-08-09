/** Shared CSS / role selectors for Hemagon UI. */
export const loginSelectors = {
  emailInput:    '#input-email',
  passwordInput: '#input-password',
  submitButton:  '#btn-login',
  cookieAccept:  '.cookies-alert__button',
} as const;

export const navSelectors = {
  userBlock:     '.user-block',
  userName:      '.user-block .name',
  loginButton:   '.user-block .btn.small',
} as const;

export const tournamentFormSelectors = {
  testTournamentRadio: '#input-tournament-test-true',
  realTournamentRadio: '#input-tournament-test-false',
  titleInput:          '#input-tournament-title',
  slugInput:           '#input-tournament-id-string',
  startDateInput:      '.advanced-datepicker >> nth=0',
  endDateInput:        '.advanced-datepicker >> nth=1',
  countryWrapper:      '#input-tournament-country',
  cityWrapper:         '#input-tournament-city',
  descriptionTextarea: '#input-tournament-description',
  paymentCheckbox:     'label:has-text("Payment information") input[type="checkbox"]',
  rulesCheckbox:       'label:has-text("Link to the rules document") input[type="checkbox"]',
  siteCheckbox:        'label:has-text("Link to your website") input[type="checkbox"]',
  streamInput:         '#input-tournament-stream',
  saveButton:          '#btn-tournament-save',
} as const;

/** Nomination create/edit settings (`/nominations/new/settings`). */
export const nominationFormSelectors = {
  titleInput:              '#input-nomination-title',
  slugInput:               '#input-nomination-slug',
  fightingCategoryYes:     '#input-nomination-isfight-true',
  fightingCategoryNo:      '#input-nomination-isfight-false',
  weaponSelect:            '#input-nomination-weapon',
  teamYes:                 '#input-nomination-isteam-true',
  teamNo:                  '#input-nomination-isteam-false',
  twoThirdPlaceYes:        '#input-nomination-twoThirdPlace-true',
  twoThirdPlaceNo:         '#input-nomination-twoThirdPlace-false',
  saveButton:              '#btn-nomination-save',
} as const;

/** Tournament nominations list (`/organizer/tournaments/:id/nominations`). */
export const tournamentNominationsSelectors = {
  grid:              '#grid-nomination',
  addCategoryButton: '#btn-nomination-add',
} as const;

/** Nomination participants / requests (`/nominations/:id/requests`). */
export const nominationParticipantsSelectors = {
  enrollCountInput:    '#input-requests-test-enroll-number-alt',
  enrollTestUsersButton: '#btn-requests-test-enroll',
  participantsTable:   '.grid table',
  participantRows:     '.grid table tbody tr[id^="entity-"]',
} as const;

/** Nomination stages (`/nominations/:id/stages`). */
export const nominationStagesSelectors = {
  addStageButton: '#btn-stage-add',
  formCard:       '.card.card-huge.card-outline',
  formTitle:      '.h3',
  typeRadio:      (type: string) => `#input-stage-type-${type}`,
  fightTimeInput: '#input-stage-fightTime',
  tillFinalsYes:  '#input-stage-tillFinals-true',
  tillFinalsNo:   '#input-stage-tillFinals-false',
  tillFinalsQual: '#input-stage-tillFinals-abQualification',
  /** Real checkbox is hidden behind a custom switch — read state here, click `unlimitedPoolSwitch`. */
  unlimitedPool:       '.form-group:has-text("Unlimited pool") input[type="checkbox"]',
  unlimitedPoolSwitch: '.form-group:has-text("Unlimited pool") .switch',
  /** "Goes next stage" presets — only present in Edit mode once a later stage exists. */
  outputCountRadio: (n: number) => `#input-stage-outputCount-${n}`,
  /** "From each pool surely goes to the next stage" — `any` / `1`…`5` (Edit form, pools). */
  minimumFromEachPoolRadio: (value: string | number) => `#input-stage-minimumFromEachPool-${value}`,
  /** "Hold a fight for the third place" — elimination add/edit form, defaults to true. */
  fightForThirdPlaceRadio: (value: boolean) => `#input-stage-fightForThirdPlace-${value}`,
  cancelButton:   '#btn-stage-editing-cancel',
  saveButton:     '#btn-stage-editing-save',

  /**
   * Saved stage cards (index `n` matches `#btn-stage-{n}-remove`). The `:not([id*="-pool-"])`
   * guard excludes per-pool remove buttons (`#btn-stage-{n}-pool-{p}-remove`).
   */
  allStageRemoveButtons:   '[id^="btn-stage-"][id$="-remove"]:not([id*="-pool-"])',
  stageRemoveButton:       (n: number) => `#btn-stage-${n}-remove`,
  stageEditButton:         (n: number) => `#btn-_stage-${n}-edit`,
  stageEnrollAllButton:    (n: number) => `#btn-stage-${n}-enroll-all`,
  /** POOL stages — add an empty pool and auto-distribute participants into pools. */
  stageAddPoolButton:      (n: number) => `#btn-stage-${n}-add-pool`,
  seedRandomlyLabel:       'Seed randomly',

  stageSettings:           '.stage-settings',
  stageParticipantsPanel:  '.users.card-small',
  stageParticipantsSearch: 'input[placeholder="Search by name or club"]',
  stageRoundsContainer:    '.rounds-container',
  stageRoundCard:          '.rounds-container .pool.card-small',
  /** Link from organizer nomination header to the public bracket page. */
  goToPublicPageLink:      '#link-go-to-public-view-nomination',
  /** Opens the pool conduct page from a saved pool card (`#btn-stage-{s}-pool-{p}-run`). */
  poolRunButton:           (stageIndex: number, poolIndex: number) =>
    `#btn-stage-${stageIndex}-pool-${poolIndex}-run`,
  poolAllFightsDoneLabel:  'All fights done',
  /** POOL stage — populate the next stage bracket from completed pool results. */
  buildNextStageButton:    (stageIndex: number) => `#btn-stage-${stageIndex}-build-next-stage`,
  /** ELIMINATION — bracket fight labels (`Round 1, fight 1`, …). */
  bracketRoundFightLabel:  (round: number) => new RegExp(`Round ${round}, fight \\d+`, 'i'),
  /**
   * ELIMINATION — fill random scores for a round. Every round block renders the same
   * button id, so it is addressed by accessible name inside the round's scope.
   */
  stageRndResultsLabel:    /RND results/i,
  /** ELIMINATION — advance winners on one bracket side to the next round. */
  buildNextSideRoundButton: (stageIndex: number, sideIndex: number) =>
    `#btn-stage-${stageIndex}-side-${sideIndex}-build-next-elimination-round`,
  /**
   * SWISS — appends the next round from current standings. Rendered only once the
   * current round shows "All fights done", so its presence is the readiness signal.
   */
  buildNextSwissRoundButton: (stageIndex: number) =>
    `#btn-stage-${stageIndex}-build-next-round-swiss`,
  /** SWISS — opens the stage standings modal (rendered at page level, not in the card). */
  stageRatingButton:     (stageIndex: number) => `#btn-stage-${stageIndex}-rating`,
  stageRatingModalTitle: 'Rating',
  /** ELIMINATION — both sides finished semis → build gold/bronze finals (`round: 1` in API body). */
  buildFinalsButton: (stageIndex: number) =>
    `#btn-stage-${stageIndex}-build-next-round-elimination`,
  finalsGoldFightLabel:   'Finals, gold fight',
  finalsBronzeFightLabel: 'Finals, bronze fight',
  eliminationSidePendingLabel: 'Previous round of this side is not finished yet',
} as const;

/**
 * Shared organizer modal. Rendered at page level with a `.backdrop` sibling that
 * swallows clicks elsewhere, so an open popup must be closed before continuing.
 * Neither Escape nor a backdrop click dismisses it — only `.btn-close` does.
 */
export const popupSelectors = {
  root:        '.popup',
  closeButton: '.btn-close',
} as const;

/** Organizer pool conduct page (`/nominations/:id/pools/:poolId`). */
export const nominationPoolSelectors = {
  /** `#btn-pool-{poolId}-rnd-results` — unique on the single-pool conduct route. */
  rndResultsButton: '[id^="btn-pool-"][id$="-rnd-results"]',
} as const;

/** Public nomination bracket (`/tournament/:slug/nomination/:slug`). */
export const nominationPublicSelectors = {
  bracketTab:              'Bracket',
  eliminationStageTitle:   /Stage \d+\.\s*Elimination/i,
  /** Top-level tab; navigates to `…/final-standings`. */
  finalStandingsTab:       'Final standings',
  /**
   * SWISS "Rating" sub-tab under the "Swiss system" heading. Exact matching keeps it
   * apart from the page-level "Rating mode" control.
   */
  swissRatingTab:          'Rating',
  /**
   * SWISS round titles on the public "Pools" sub-tab (`Round 1`, `Round 2`, …).
   * Matched against rendered text, where each title sits on its own line. Global on
   * purpose — it is only ever used with `String.matchAll`.
   */
  swissRoundTitles:        /\bRound\s+(\d+)\b/g,
} as const;

/** Standings tables (organizer stage card, public Rating tab, public Final standings). */
export const standingsTableSelectors = {
  fightsColumn:      /^Fights$/i,
  winsColumn:        /^W$/,
  lossesColumn:      /^L$/,
  drawsColumn:       /^D$/,
  techLossesColumn:  /^TL$/,
  matchPointsColumn: /^Match Points$/i,
  coefColumn:        /^Coef\.?$/i,
  pointsEarnedColumn: /^Pts earned$/i,
  pointsLostColumn:   /^Pts lost$/i,
} as const;

/** Tournament overview — status toggle row (`#btn-set-status-*`). */
export const tournamentStatusSelectors = {
  button: (statusCode: string) => `#btn-set-status-${statusCode}`,
  activeButton: (statusCode: string) => `#btn-set-status-${statusCode}.active`,
} as const;
