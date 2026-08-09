import { autotestLabel } from '../helpers/randomCode';

export interface SelectOption {
  label: string;
  value: string;
}

export interface TournamentKeyboardSettings {
  pointLeftAdd:     string;
  pointLeftRemove:  string;
  pointRightAdd:    string;
  pointRightRemove: string;
  toggleTimer:      string;
  doubleAdd:        string;
  doubleRemove:     string;
  boutAdd:          string;
  boutRemove:       string;
}

export interface TournamentApiPayload {
  idString:                    string;
  title:                       string;
  description:                 string;
  descriptionPayment:          string;
  dateStart:                   string;
  dateEnd:                     string;
  registrationDateStart:       string;
  registrationDateEnd:         string;
  country:                     SelectOption;
  city:                        SelectOption;
  address:                     string;
  map:                         string;
  test:                        boolean;
  imagePreview:                string;
  imageApp:                    string;
  stream:                      string;
  link:                        string | null;
  state:                       string;
  nominations:                 unknown[];
  applicationsAccess:          string;
  applicationsShowPayments:    boolean;
  applicationsShowWaitingList: boolean;
  approvalRequestSent:         boolean;
  zone:                        string | null;
  keyboardSettings:            TournamentKeyboardSettings;
}

/**
 * Tournament Purpose: Testing (UI radio `#input-tournament-test-true`, API field `test: true`).
 * Required so autotests can add participants without a public/production tournament.
 */
export const TOURNAMENT_PURPOSE_IS_TESTING = true;

export const DEFAULT_TOURNAMENT_COUNTRY: SelectOption = {
  label: 'Georgia',
  value: 'GE',
};

export const DEFAULT_TOURNAMENT_CITY: SelectOption = {
  label: 'Tbilisi',
  value: '3453056',
};

export const DEFAULT_KEYBOARD_SETTINGS: TournamentKeyboardSettings = {
  pointLeftAdd:     'KeyQ',
  pointLeftRemove:  'KeyA',
  pointRightAdd:    'BracketRight',
  pointRightRemove: 'Quote',
  toggleTimer:      'Space',
  doubleAdd:        'KeyY',
  doubleRemove:     'KeyH',
  boutAdd:          'KeyU',
  boutRemove:       'KeyJ',
};

export function toTournamentSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildTournamentPayload(
  overrides: Partial<TournamentApiPayload> = {},
): TournamentApiPayload {
  const { test: _purposeIgnored, ...safeOverrides } = overrides;
  const now   = new Date().toISOString();
  const title = safeOverrides.title ?? autotestLabel('AUTOTEST Tournament');

  return {
    idString:                    toTournamentSlug(safeOverrides.idString ?? title),
    title,
    description:                 '',
    descriptionPayment:          '',
    dateStart:                   now,
    dateEnd:                     now,
    registrationDateStart:       now,
    registrationDateEnd:         now,
    country:                     DEFAULT_TOURNAMENT_COUNTRY,
    city:                        DEFAULT_TOURNAMENT_CITY,
    address:                     '',
    map:                         '',
    imagePreview:                '',
    imageApp:                    '',
    stream:                      '',
    link:                        null,
    state:                       'DEVELOPING',
    nominations:                 [],
    applicationsAccess:          'APPROVED',
    applicationsShowPayments:    false,
    applicationsShowWaitingList: false,
    approvalRequestSent:         false,
    zone:                        null,
    keyboardSettings:            DEFAULT_KEYBOARD_SETTINGS,
    ...safeOverrides,
    test:                        TOURNAMENT_PURPOSE_IS_TESTING,
  };
}

