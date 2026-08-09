import {
  test as base,
  expect,
  type APIRequestContext,
  type APIResponse,
} from '@playwright/test';
import { attachApiExchange, buildApiExchange } from '../helpers/apiReport';
import type { EnrolledParticipant, EnrollTestUsersOptions } from '../data/participantData';
import { authenticateApi, type AuthenticatedApi } from './apiAuth.fixture';
import { ResourceTracker } from './resourceTracker';

export interface TestApi extends AuthenticatedApi {
  /** Register pool users onto a nomination via API; uses the seeded shared pool. */
  enrollTestUsers: (
    count: number,
    options?: EnrollTestUsersOptions,
  ) => Promise<EnrolledParticipant[]>;
}

type ApiMethodName = 'delete' | 'fetch' | 'get' | 'head' | 'patch' | 'post' | 'put';

const API_METHODS = new Set<PropertyKey>([
  'delete',
  'fetch',
  'get',
  'head',
  'patch',
  'post',
  'put',
]);

interface HemagonFixtures {
  /** Authenticated organizer API with tournament/ring/nomination factories. */
  api: TestApi;
  /** Auto-cleanup tracker; tears down registered resources after each test. */
  resources: ResourceTracker;
}

/**
 * Single entry point for every spec. The `request` context is proxied so every
 * API call (factories, auth, cleanup) is attached to Allure — in API and UI tests alike.
 */
export const test = base.extend<HemagonFixtures>({
  request: async ({ request }, use, testInfo) => {
    let apiCallIndex = 0;

    const recordedRequest = new Proxy(request, {
      get(target, property, receiver) {
        const value = Reflect.get(target, property, receiver);

        if (!API_METHODS.has(property) || typeof value !== 'function') {
          return typeof value === 'function' ? value.bind(target) : value;
        }

        return async (...args: unknown[]): Promise<APIResponse> => {
          const method   = String(property) as ApiMethodName;
          const response = await value.apply(target, args) as APIResponse;
          const exchange = await buildApiExchange(++apiCallIndex, method, resolveUrl(args[0]), args[1], response);

          await attachApiExchange(testInfo, exchange);

          return response;
        };
      },
    });

    await use(recordedRequest as APIRequestContext);
  },

  api: async ({ request }, use) => {
    const authApi = await authenticateApi(request);

    const api: TestApi = {
      ...authApi,
      enrollTestUsers: (count, options) =>
        authApi.participants.enrollTestUsers(count, options),
    };

    await use(api);
  },

  resources: async ({ api }, use, testInfo) => {
    const tracker = new ResourceTracker(api);
    await use(tracker);
    await tracker.cleanup(testInfo);
  },

});

export { expect };

function resolveUrl(input: unknown): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return String(input);
}
