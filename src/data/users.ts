export enum UserRole {
  Organizer = 'organizer',
}

export interface UserCredentials {
  email:    string;
  password: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}. Copy .env.example to .env and fill credentials.`);
  }
  return value;
}

export const users: Record<UserRole, UserCredentials> = {
  [UserRole.Organizer]: {
    email:    requireEnv('ORGANIZER_EMAIL'),
    password: requireEnv('ORGANIZER_PASSWORD'),
  },
};
