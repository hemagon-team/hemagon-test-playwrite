import type { APIRequestContext } from '@playwright/test';
import { endpoints } from '../data/endpoints';
import { UserRole, users } from '../data/users';
import { NominationFactory } from '../factories/nomination.factory';
import { ParticipantFactory } from '../factories/participant.factory';
import { RingFactory } from '../factories/ring.factory';
import { StageFactory } from '../factories/stage.factory';
import { TournamentFactory } from '../factories/tournament.factory';
import {
  extractAuthTokenFromHeaders,
  LoginRequestSchema,
  LoginUserSchema,
  type LoginRequest,
  type LoginUser,
} from '../schemas/auth.schema';

export type AuthHeaders = Record<string, string>;

export interface ApiLoginResult {
  token:       string;
  authHeaders: AuthHeaders;
  user:        LoginUser;
  loginPath:   string;
}

export interface AuthenticatedApi {
  token:       string;
  authHeaders: AuthHeaders;
  user:        LoginUser;
  tournaments:  TournamentFactory;
  rings:        RingFactory;
  nominations:  NominationFactory;
  participants: ParticipantFactory;
  stages:       StageFactory;
}

export async function loginViaApi(
  request: APIRequestContext,
  role: UserRole = UserRole.Organizer,
): Promise<ApiLoginResult> {
  const { email, password } = users[role];
  return loginViaApiWithCredentials(request, email, password);
}

export async function loginViaApiWithCredentials(
  request: APIRequestContext,
  email: string,
  password: string,
  loginPath: string = endpoints.auth.login,
): Promise<ApiLoginResult> {
  const payload: LoginRequest = LoginRequestSchema.parse({ email, password });

  const res = await request.post(loginPath, { data: payload });
  if (!res.ok()) {
    throw new Error(`POST ${loginPath} failed: ${res.status()} ${await res.text()}`);
  }

  const user  = LoginUserSchema.parse(await res.json());
  const token = extractAuthTokenFromHeaders(res.headers());

  return {
    token,
    user,
    loginPath,
    authHeaders: { Authorization: token },
  };
}

export async function authenticateApi(
  request: APIRequestContext,
  role: UserRole = UserRole.Organizer,
): Promise<AuthenticatedApi> {
  const { token, authHeaders, user } = await loginViaApi(request, role);

  const participants = new ParticipantFactory(request, authHeaders);

  return {
    token,
    authHeaders,
    user,
    tournaments:  new TournamentFactory(request, authHeaders),
    rings:        new RingFactory(request, authHeaders),
    nominations:  new NominationFactory(request, authHeaders),
    participants,
    stages:       new StageFactory(request, authHeaders),
  };
}
