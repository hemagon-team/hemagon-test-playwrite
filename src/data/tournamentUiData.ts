import { randomNumericCode } from '../helpers/randomCode';

/**
 * Hardcoded values for tournament settings UI smoke (content is not used downstream).
 * Tournament Purpose: Testing is always set in the form — see TOURNAMENT_PURPOSE_IS_TESTING.
 */
export const TOURNAMENT_UI_FORM = {
  title:       'AutoTest Tournament',
  slug:        'autotes',
  country:     'Spain',
  city:        'Barcelona',
  description: 'Any Tournament Description',
  paymentInfo: 'Some Info',
  rulesUrl:    'https://stage.hemagon.com/',
  rulesLabel:  'Rules link',
  siteUrl:     'https://stage.hemagon.com/',
  siteLabel:   'Tournament site',
  stream:      'https://www.youtube.com/watch?v=0kJZ7RMXDKc&list=RDMM0kJZ7RMXDKc&start_radio=1',
} as const;

/** Same display format as Hemagon date pickers (`31 May 2026`). */
export function formatTournamentDateToday(): string {
  const now = new Date();
  const day = now.getDate();
  const month = now.toLocaleString('en-GB', { month: 'long' });
  const year = now.getFullYear();
  return `${day} ${month} ${year}`;
}

/** Unique title/slug per run while keeping human-readable prefixes. */
export function uniqueTournamentUiFields(): { title: string; slug: string } {
  const suffix = randomNumericCode();
  return {
    title: `${TOURNAMENT_UI_FORM.title} ${suffix}`,
    slug:  `${TOURNAMENT_UI_FORM.slug}-${suffix}`,
  };
}
