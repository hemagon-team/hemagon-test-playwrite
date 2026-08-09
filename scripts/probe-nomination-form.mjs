#!/usr/bin/env node
import dotenv from 'dotenv';
import { chromium } from '@playwright/test';

dotenv.config();

const base = process.env.BASE_URL ?? 'https://stage.hemagon.com';
const email = process.env.ORGANIZER_EMAIL;
const password = process.env.ORGANIZER_PASSWORD;
const tournamentId = process.argv[2] ?? '6a17243f073c34ce8937ec82';

if (!email || !password) {
  console.error('Set ORGANIZER_EMAIL and ORGANIZER_PASSWORD in .env');
  process.exit(1);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

await page.goto(`${base}/login`);
const cookie = page.getByRole('button', { name: /yes, i agree|understood/i });
if (await cookie.isVisible().catch(() => false)) await cookie.click();
await page.locator('#input-email').fill(email);
await page.locator('#input-password').fill(password);
await page.locator('#btn-login').click();
await page.waitForURL(url => !url.pathname.startsWith('/login'), { timeout: 60_000 });

const url = `${base}/organizer/tournaments/${tournamentId}/nominations/new/settings`;
await page.goto(url);
await page.waitForSelector('#input-nomination-title', { timeout: 60_000 });

const ids = await page.evaluate(() =>
  [...document.querySelectorAll('[id]')]
    .map(el => el.id)
    .filter(id => id.includes('nomination'))
    .sort(),
);

console.log('ids:\n', ids.join('\n'));

const radios = await page.evaluate(() =>
  [...document.querySelectorAll('input[type="radio"]')]
    .map(el => ({ id: el.id, name: el.name, value: el.value, checked: el.checked }))
    .filter(r => r.id.includes('nomination') || r.name.includes('nomination')),
);

console.log('\nradios:\n', JSON.stringify(radios, null, 2));

const weapon = await page.locator('#input-nomination-weapon').innerHTML().catch(() => 'missing');
console.log('\nweapon html length:', weapon.length);

await page.goto(`${base}/organizer/tournaments/${tournamentId}/nominations`);
await page.waitForTimeout(3000);
const listIds = await page.evaluate(() =>
  [...document.querySelectorAll('[id]')]
    .map(el => el.id)
    .filter(id => id.includes('nomination') || id.includes('grid'))
    .sort(),
);
console.log('\nlist page ids:\n', listIds.join('\n'));

await browser.close();
