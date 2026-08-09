import { autotestLabel } from '../helpers/randomCode';
import { toTournamentSlug } from './tournamentData';

/** Katana weapon id on stage (matches UI category autotests). */
export const NOMINATION_WEAPON_KATANA_ID = '6280a892d670eb00387f6e21' as const;

export interface NominationApiPayload {
  idString:             string;
  title:                string;
  description:          string;
  fightTime:            number;
  lastRoundTime:        number;
  weapon:               string;
  tournament:           string;
  stages:               unknown[];
  ratingMode:           string;
  timeMode:             string;
  showTimer:            boolean;
  showDoubles:          boolean;
  showBouts:            boolean;
  showAppeals:          boolean;
  showWarnings:         boolean;
  showWarnings2:        boolean;
  switchFightAndTeamScores: boolean;
  isTeam:               boolean;
  redPosition:          string;
  fightAddedValue:      number;
  fightersLimit:        number;
  twoThirdsPlace:       boolean;
  leftFighterColor:     string;
  rightFighterColor:    string;
  isFightingNomination: boolean;
  stopTimeOnScore:      boolean;
}

export function toNominationSlug(value: string): string {
  return toTournamentSlug(value);
}

export function buildNominationPayload(
  tournamentId: string,
  overrides: Partial<NominationApiPayload> = {},
): NominationApiPayload {
  const { tournament: _t, weapon: weaponOverride, ...safeOverrides } = overrides;
  const title = safeOverrides.title ?? autotestLabel('AUTOTEST API Category');

  return {
    idString:                 toNominationSlug(safeOverrides.idString ?? title),
    title,
    description:              '',
    fightTime:                120,
    lastRoundTime:            0,
    stages:                   [],
    ratingMode:               'RATING_MODE_MATCH_POINTS',
    timeMode:                 'STRAIGHT',
    showTimer:                true,
    showDoubles:              false,
    showBouts:                false,
    showAppeals:              false,
    showWarnings:             false,
    showWarnings2:            false,
    switchFightAndTeamScores: false,
    isTeam:                   false,
    redPosition:              'RIGHT',
    fightAddedValue:          1,
    fightersLimit:            24,
    twoThirdsPlace:           false, // mirrors the product default (UI radio "No")
    leftFighterColor:         'red',
    rightFighterColor:        'blue',
    isFightingNomination:     true,
    stopTimeOnScore:          false,
    ...safeOverrides,
    tournament: tournamentId,
    weapon:     weaponOverride ?? NOMINATION_WEAPON_KATANA_ID,
  };
}
