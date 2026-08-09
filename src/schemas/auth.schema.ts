import { z } from 'zod';

export const LoginRequestSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

/** JSON body returned by POST /api/auth/login. */
export const LoginUserSchema = z.object({
  _id:      z.string().min(1),
  name:     z.string().optional(),
  username: z.string().min(1),
  role:     z.string().min(1),
}).passthrough();

export type LoginUser = z.infer<typeof LoginUserSchema>;

export function extractAuthTokenFromHeaders(
  headers: Record<string, string>,
): string {
  const raw = headers['authorization'] ?? headers['Authorization'];
  if (!raw) {
    throw new Error('No Authorization header in login response');
  }
  // Hemagon returns raw JWT (Bearer prefix is rejected by the API).
  return raw.replace(/^Bearer\s+/i, '').trim();
}
