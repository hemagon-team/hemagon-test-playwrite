import { API_PREFIX, AUTH_LOGIN_PATH } from './config';

/** Single source of truth for Hemagon REST paths used by factories and UI waits. */
export const endpoints = {
  auth: {
    login: AUTH_LOGIN_PATH,
  },
  tournaments: {
    base: `${API_PREFIX}/organizer/tournaments`,
    byId: (id: string) => `${API_PREFIX}/organizer/tournaments/${id}`,
  },
  areas: {
    base: `${API_PREFIX}/organizer/areas`,
    byId: (id: string) => `${API_PREFIX}/organizer/areas/${id}`,
    listForTournament: (tournamentId: string) =>
      `${API_PREFIX}/organizer/areas?sort=title&page=1&perPage=100&filter=tournament:${tournamentId}`,
  },
  nominations: {
    base: `${API_PREFIX}/organizer/nominations`,
    byId: (id: string) => `${API_PREFIX}/organizer/nominations/${id}`,
  },
  requests: {
    base: `${API_PREFIX}/organizer/requests`,
    byId: (id: string) => `${API_PREFIX}/organizer/requests/${id}`,
    listApprovedForNomination: (nominationId: string) =>
      `${API_PREFIX}/organizer/requests?filter=nomination:${nominationId},state:APPROVED&perPage=0`,
  },
  pools: {
    byId: (id: string) => `${API_PREFIX}/pools/${id}`,
  },
  fights: {
    base: `${API_PREFIX}/organizer/fights`,
    byId: (id: string) => `${API_PREFIX}/organizer/fights/${id}`,
  },
  stages: {
    buildNextStage:             `${API_PREFIX}/organizer/stages/build-next-stage`,
    buildNextRoundElimination:  `${API_PREFIX}/organizer/stages/build-next-round-elimination`,
    /** SWISS — body `{ stage }`; appends one round paired from current standings. */
    buildNextRoundSwiss:        `${API_PREFIX}/organizer/stages/build-next-round-swiss`,
    listForNomination: (nominationId: string) =>
      `${API_PREFIX}/organizer/stages/${nominationId}`,
  },
} as const;
