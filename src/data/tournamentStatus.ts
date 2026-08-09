/** API/state codes used by `#btn-set-status-*` on the tournament overview page. */
export const TournamentStatusCode = {
  Hidden:             'DEVELOPING',
  Upcoming:           'UPCOMING',
  RegistrationOpened: 'REG_OPEN',
  RegistrationClosed: 'REG_CLOSED',
  Ongoing:            'ONGOING',
  Finished:           'FINISHED',
} as const;

export type TournamentStatusCode =
  (typeof TournamentStatusCode)[keyof typeof TournamentStatusCode];

/** Default status after creating a tournament (UI label: Hidden). */
export const DEFAULT_TOURNAMENT_STATUS: TournamentStatusCode = TournamentStatusCode.Hidden;

/** Body for `PUT /organizer/tournaments/:id` status change. */
export function buildTournamentStateUpdatePayload(
  tournamentId: string,
  state: TournamentStatusCode,
): { _id: string; state: TournamentStatusCode } {
  return { _id: tournamentId, state };
}
