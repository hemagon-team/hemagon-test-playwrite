import { randomNumericCode } from '../helpers/randomCode';
import { NOMINATION_WEAPON_KATANA_ID } from './nominationData';

/** Weapon label on the nomination settings form (native `<select>`). */
export const NOMINATION_UI_WEAPON = 'Katana' as const;

/** Stage weapon id for Katana (options load after Fighting category = Yes). */
export const NOMINATION_WEAPON_KATANA_VALUE = NOMINATION_WEAPON_KATANA_ID;

/** Unique title and URL slug per test run. */
export function uniqueNominationUiFields(): { title: string; slug: string } {
  const suffix = randomNumericCode();
  return {
    title: `AUTOTEST Nomination ${suffix}`,
    slug:  `autotest-nomination-${suffix}`,
  };
}

export interface NominationSettingsFormData {
  title:           string;
  slug:            string;
  team:            boolean;
  twoThirdPlace:   boolean;
}

export function buildNominationSettingsFormData(
  overrides: Partial<NominationSettingsFormData> = {},
): NominationSettingsFormData {
  const unique = uniqueNominationUiFields();
  return {
    title:         overrides.title         ?? unique.title,
    slug:          overrides.slug          ?? unique.slug,
    team:          overrides.team          ?? false,
    twoThirdPlace: overrides.twoThirdPlace ?? false,
  };
}
