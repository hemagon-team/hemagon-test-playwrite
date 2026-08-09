import { test, expect } from '../../../src/fixtures/test';
import { loginViaApi } from '../../../src/fixtures/apiAuth.fixture';
import { UserRole } from '../../../src/data/users';
import { endpoints } from '../../../src/data/endpoints';

test.describe('Auth API', () => {
  test('organizer can log in with valid token and user body', async ({ request }) => {
    const { token, authHeaders, user, loginPath } = await loginViaApi(request, UserRole.Organizer);

    expect(loginPath).toBe(endpoints.auth.login);
    expect(token).toBeTruthy();
    expect(token.split('.')).toHaveLength(3);
    expect(authHeaders.Authorization).toBe(token);
    expect(user._id).toBeTruthy();
    expect(user.username).toBeTruthy();
    expect(user.role).toBeTruthy();
    expect(['ORGANIZER', 'ADMIN']).toContain(user.role);
  });

  test('invalid credentials return error status', async ({ request }) => {
    const res = await request.post(endpoints.auth.login, {
      data: {
        email:    'invalid@example.com',
        password: 'wrong-password',
      },
    });

    expect(res.ok()).toBeFalsy();
    expect([400, 401, 403, 422]).toContain(res.status());
  });
});
