export interface RingApiPayload {
  title:      string;
  tournament: string;
}

/** Hemagon auto-creates this ring with every new tournament. */
export const DEFAULT_RING_TITLE = 'Default Ring';

export function buildRingPayload(
  tournamentId: string,
  title: string = DEFAULT_RING_TITLE,
): RingApiPayload {
  return {
    title,
    tournament: tournamentId,
  };
}
