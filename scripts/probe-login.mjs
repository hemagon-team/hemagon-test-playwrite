#!/usr/bin/env node
/**
 * Probes Hemagon login API. Run: npm run probe:login
 */
import dotenv from 'dotenv';

dotenv.config();

const base = process.env.BASE_URL ?? 'https://hemagon.com';
const email = process.env.ORGANIZER_EMAIL;
const password = process.env.ORGANIZER_PASSWORD;

if (!email || !password) {
  console.error('Set ORGANIZER_EMAIL and ORGANIZER_PASSWORD in .env');
  process.exit(1);
}

const res = await fetch(`${base}/api/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

console.log('POST /api/auth/login →', res.status);
console.log('Authorization header present:', Boolean(res.headers.get('authorization')));

if (res.ok) {
  const user = await res.json();
  console.log('User:', user.username, user.role);
  const token = res.headers.get('authorization');
  const org = await fetch(`${base}/api/organizer/tournaments`, {
    headers: { Authorization: token ?? '' },
  });
  console.log('GET /api/organizer/tournaments →', org.status);
}
