/** Target pool size for shared test users (UI "Enroll test users" seed). */
export const PARTICIPANT_POOL_TARGET = 100;

/** How long enroll must stay idle before we treat the batch as finished. */
export const PARTICIPANT_ENROLL_STABLE_MS = 3_000;

/** Max wait for a large UI enroll batch. */
export const PARTICIPANT_ENROLL_TIMEOUT_MS = 180_000;

export interface ParticipantRequestApiPayload {
  user:       string;
  nomination: string;
  state:      'APPROVED';
}

export interface EnrollTestUsersOptions {
  /** Target nomination; defaults to the shared pool nomination. */
  nominationId?: string;
}

export interface EnrolledParticipant {
  requestId: string;
  userId:    string;
  name:      string;
  email:     string;
  paid:      boolean;
  presence:  boolean;
}

export interface ParticipantPoolEntry {
  requestId: string;
  userId:    string;
  name:      string;
  email:     string;
}

export interface ParticipantPool {
  tournamentId: string;
  nominationId: string;
  participants: ParticipantPoolEntry[];
}

export function buildParticipantRequestPayload(
  nominationId: string,
  userId: string,
): ParticipantRequestApiPayload {
  return {
    user:       userId,
    nomination: nominationId,
    state:      'APPROVED',
  };
}

export function toEnrolledParticipant(
  response: ParticipantRequestApiResponseLike,
  overrides: Partial<Pick<EnrolledParticipant, 'paid' | 'presence'>> = {},
): EnrolledParticipant {
  return {
    requestId: response._id,
    userId:    response.user._id,
    name:      response.user.name,
    email:     response.user.email,
    paid:      overrides.paid ?? response.paid ?? false,
    presence:  overrides.presence ?? response.presence ?? false,
  };
}

/** Minimal shape for mapping API / pool rows to {@link EnrolledParticipant}. */
export interface ParticipantRequestApiResponseLike {
  _id:      string;
  paid?:    boolean;
  presence?: boolean;
  user: {
    _id:   string;
    name:  string;
    email: string;
  };
}
