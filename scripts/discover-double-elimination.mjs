/**
 * Phase 0 discovery: Pools → Double Elimination on stage.
 * Creates a throwaway test tournament, captures UI + API shape, deletes on exit.
 *
 * Usage: node scripts/discover-double-elimination.mjs
 */
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

dotenv.config();

const base = process.env.BASE_URL;
const email = process.env.ORGANIZER_EMAIL;
const password = process.env.ORGANIZER_PASSWORD;

if (!base || !email || !password) {
  console.error('Missing BASE_URL / ORGANIZER_EMAIL / ORGANIZER_PASSWORD in .env');
  process.exit(1);
}

const PARTICIPANTS = 16;
const POOL_COUNT = 3;
const FIGHT_TIME = 120;
const WEAPON_KATANA = '6280a892d670eb00387f6e21';
const OUT_DIR = path.resolve('docs/discovery');
const SNAPSHOT_DIR = path.join(OUT_DIR, 'double-elimination-snapshots');

const report = {
  timestamp: new Date().toISOString(),
  baseUrl: base,
  participants: PARTICIPANTS,
  poolCount: POOL_COUNT,
  doubleElimAddForm: null,
  poolEditForm: null,
  stageTitles: [],
  buildNextStage: null,
  stagesAfterBuild: null,
  bracketUi: null,
  publicPage: null,
  errors: [],
};

function stageUserId(user) {
  return typeof user === 'string' ? user : user?._id;
}

function stageUserName(user) {
  if (!user || typeof user === 'string') return null;
  return typeof user.name === 'string' ? user.name : null;
}

function summarizeStage(stage) {
  const sides = new Map();
  for (const pool of stage.pools ?? []) {
    const key = `${pool.side ?? '?'}-r${pool.round ?? '?'}`;
    if (!sides.has(key)) sides.set(key, []);
    sides.get(key).push({
      title: pool.title,
      index: pool.index,
      side: pool.side,
      round: pool.round,
      users: (pool.users ?? []).length,
      fights: (pool.fights ?? []).length,
      fightResults: (pool.fights ?? []).map(f => f.result),
    });
  }

  return {
    _id: stage._id,
    type: stage.type,
    order: stage.order,
    settings: stage.settings,
    poolBoutCount: stage.pools?.length ?? 0,
    uniqueEntrantsRound0: new Set(
      (stage.pools ?? [])
        .filter(p => p.round === 0 && p.side !== 2)
        .flatMap(p => (p.users ?? []).map(stageUserId)),
    ).size,
    sideRoundSummary: Object.fromEntries(sides),
    boutTitles: (stage.pools ?? []).map(p => p.title),
  };
}

async function login(page) {
  await page.goto(`${base}/login`);
  const cookie = page.getByRole('button', { name: /yes, i agree/i });
  if (await cookie.isVisible().catch(() => false)) await cookie.click();
  await page.locator('#input-email').fill(email);
  await page.locator('#input-password').fill(password);
  await page.locator('#btn-login').click();
  await page.waitForURL(u => !u.pathname.startsWith('/login'), { timeout: 30_000 });
}

async function authHeaders(page) {
  const res = await page.request.post(`${base}/api/auth/login`, {
    data: { email, password },
  });
  if (!res.ok()) {
    throw new Error(`Login failed: ${res.status()} ${await res.text()}`);
  }
  const raw = res.headers()['authorization'] ?? res.headers()['Authorization'];
  if (!raw) throw new Error('No Authorization header in login response');
  const token = raw.replace(/^Bearer\s+/i, '').trim();
  return { Authorization: token };
}

function buildTournamentPayload(title) {
  const now = new Date().toISOString();
  const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return {
    idString: slug,
    title,
    description: '',
    descriptionPayment: '',
    dateStart: now,
    dateEnd: now,
    registrationDateStart: now,
    registrationDateEnd: now,
    country: { label: 'Georgia', value: 'GE' },
    city: { label: 'Tbilisi', value: '3453056' },
    address: '',
    map: '',
    test: true,
    imagePreview: '',
    imageApp: '',
    stream: '',
    link: null,
    state: 'DEVELOPING',
    nominations: [],
    applicationsAccess: 'APPROVED',
    applicationsShowPayments: false,
    applicationsShowWaitingList: false,
    approvalRequestSent: false,
    zone: null,
    keyboardSettings: {
      pointLeftAdd: 'KeyQ', pointLeftRemove: 'KeyA',
      pointRightAdd: 'BracketRight', pointRightRemove: 'Quote',
      toggleTimer: 'Space', doubleAdd: 'KeyY', doubleRemove: 'KeyH',
      boutAdd: 'KeyU', boutRemove: 'KeyJ',
    },
  };
}

async function createProbeTournament(page, headers) {
  const title = `AUTOTEST DE discovery ${Date.now()}`;
  const tRes = await page.request.post(`${base}/api/organizer/tournaments`, {
    headers,
    data: buildTournamentPayload(title),
  });
  if (!tRes.ok()) throw new Error(`Create tournament: ${tRes.status()} ${await tRes.text()}`);
  const tournament = await tRes.json();

  const nRes = await page.request.post(`${base}/api/organizer/nominations`, {
    headers,
    data: {
      tournament: tournament._id,
      title: 'DE Probe',
      idString: `de-probe-${Date.now()}`,
      description: '',
      fightTime: FIGHT_TIME,
      lastRoundTime: 0,
      weapon: WEAPON_KATANA,
      stages: [],
      ratingMode: 'RATING_MODE_MATCH_POINTS',
      timeMode: 'STRAIGHT',
      showTimer: true,
      showDoubles: false,
      showBouts: false,
      showAppeals: false,
      showWarnings: false,
      showWarnings2: false,
      switchFightAndTeamScores: false,
      isTeam: false,
      redPosition: 'RIGHT',
      fightAddedValue: 1,
      fightersLimit: 24,
      twoThirdsPlace: false,
      leftFighterColor: 'red',
      rightFighterColor: 'blue',
      isFightingNomination: true,
      stopTimeOnScore: false,
    },
  });
  if (!nRes.ok()) throw new Error(`Create nomination: ${nRes.status()} ${await nRes.text()}`);
  const nomination = await nRes.json();

  return { tournament, nomination, title };
}

async function enrollFromCache(page, nominationId, count, headers) {
  const poolFile = path.resolve('.cache/participant-pool.json');
  if (!fs.existsSync(poolFile)) return false;

  const pool = JSON.parse(fs.readFileSync(poolFile, 'utf8'));
  const slice = pool.participants.slice(0, count);

  for (const p of slice) {
    const res = await page.request.post(`${base}/api/organizer/requests`, {
      headers,
      data: { user: p.userId, nomination: nominationId, state: 'APPROVED' },
    });
    if (!res.ok()) {
      const body = await res.text();
      throw new Error(`Enroll failed for ${p.userId}: ${res.status()} ${body}`);
    }
  }
  return slice.length >= count;
}

async function enrollViaUi(page, tournamentId, nominationId, count) {
  await page.goto(`${base}/organizer/tournaments/${tournamentId}/nominations/${nominationId}/participants`);
  const countInput = page.locator('#input-requests-test-enroll-number-alt');
  const btn = page.locator('#btn-requests-test-enroll');
  await countInput.waitFor({ state: 'visible', timeout: 15_000 });
  await countInput.fill(String(count));
  await btn.click();
  await expectParticipantCount(page, count);
}

async function expectParticipantCount(page, count) {
  const rows = page.locator('.grid table tbody tr[id^="entity-"]');
  await page.waitForFunction(
    expected => document.querySelectorAll('.grid table tbody tr[id^="entity-"]').length >= expected,
    count,
    { timeout: 120_000 },
  );
  const actual = await rows.count();
  if (actual < count) throw new Error(`Enrolled ${actual}, expected ${count}`);
}

async function captureFormFields(formLocator) {
  return formLocator.evaluate(form => {
    const fields = [];
    form.querySelectorAll('label').forEach(label => {
      const text = label.textContent?.replace(/\s+/g, ' ').trim();
      const forId = label.getAttribute('for');
      if (!text) return;
      fields.push({ label: text, forId });
    });
    const radios = [...form.querySelectorAll('input[type="radio"]')].map(r => ({
      id: r.id,
      name: r.name,
      value: r.value,
      checked: r.checked,
      visible: r.offsetParent !== null,
    }));
    const inputs = [...form.querySelectorAll('input:not([type="radio"]):not([type="hidden"]), select, textarea')]
      .map(el => ({
        id: el.id,
        name: el.name,
        type: el.type || el.tagName,
        value: el.value,
        visible: el.offsetParent !== null,
      }));
    return { fields, radios, inputs };
  });
}

async function listVisibleRadios(page, prefix) {
  return page.locator(`[id^="${prefix}"]`).evaluateAll(els =>
    els
      .filter(el => el.offsetParent !== null)
      .map(el => ({ id: el.id, checked: el.checked })),
  );
}

async function setGoesNextStage(page, count) {
  await page.locator('#btn-_stage-0-edit').click();
  await page.waitForTimeout(400);
  const radio = page.locator(`#input-stage-outputCount-${count}`);
  if (await radio.isVisible()) {
    await radio.check();
  } else {
    await page.locator('#input-stage-outputCount-num').check();
    const numInput = page.locator('#input-stage-outputCount-num-value, [id*="outputCount"][type="number"]');
    if (await numInput.first().isVisible().catch(() => false)) {
      await numInput.first().fill(String(count));
    }
  }
  await page.locator('#btn-stage-editing-save').click();
  await page.waitForTimeout(600);
}

async function expandStageIfNeeded(page, stageIndex) {
  const runBtn = page.locator(`#btn-stage-${stageIndex}-pool-0-run`);
  if (await runBtn.isVisible().catch(() => false)) return;

  const toggle = page.locator(`#btn-stage-${stageIndex}-remove`)
    .locator('xpath=ancestor::div[contains(@class,"card")][1]')
    .locator('.stage-settings')
    .locator('xpath=preceding-sibling::div[1]//button')
    .last();
  await toggle.click();
  await page.waitForTimeout(300);
}

async function conductPoolByButton(page, runBtn, reopenStages) {
  await runBtn.waitFor({ state: 'visible', timeout: 30_000 });

  const link = runBtn.locator('xpath=ancestor::a[1]');
  const href = await link.getAttribute('href');
  if (!href) return false;

  await page.goto(href.startsWith('http') ? href : `${base}${href}`);
  await page.waitForURL(/\/pools\/[a-f0-9]+/, { timeout: 30_000 });

  const rnd = page.locator('[id^="btn-pool-"][id$="-rnd-results"]').first();
  await rnd.waitFor({ state: 'visible', timeout: 15_000 });
  page.once('dialog', d => d.accept());
  await rnd.click();

  await page.getByRole('button', { name: /^edit$/i }).first()
    .waitFor({ state: 'visible', timeout: 90_000 });

  await reopenStages();
  return true;
}

async function conductAllPools(page, reopenStages) {
  await expandStageIfNeeded(page, 0);
  const runButtons = page.locator('[id^="btn-stage-0-pool-"][id$="-run"]');
  const total = await runButtons.count();
  report.poolRunButtonCount = total;
  let conducted = 0;

  for (let j = 0; j < total; j++) {
    await expandStageIfNeeded(page, 0);
    const btn = runButtons.nth(j);
    if (!(await btn.isVisible().catch(() => false))) continue;

    const card = btn.locator('xpath=ancestor::div[contains(@class,"card-small")][1]');
    await btn.scrollIntoViewIfNeeded();
    const done = await card.getByText('All fights done', { exact: true }).isVisible().catch(() => false);
    if (done) continue;

    const usersText = await card.locator('.fa-users').locator('..').innerText().catch(() => '0');
    const fighters = Number.parseInt(usersText.match(/\d+/)?.[0] ?? '0', 10);
    if (fighters === 0) continue;

    const ok = await conductPoolByButton(page, btn, reopenStages);
    if (!ok) throw new Error(`Pool conduct failed at index ${j}`);
    conducted++;
    await page.waitForTimeout(500);
  }

  report.conductedPools = conducted;
}

async function waitForBuildNextStageEnabled(page) {
  const buildBtn = page.locator('#btn-stage-0-build-next-stage');
  await page.waitForFunction(
    () => {
      const el = document.querySelector('#btn-stage-0-build-next-stage');
      return el instanceof HTMLButtonElement && !el.disabled;
    },
    { timeout: 120_000 },
  );
  return buildBtn;
}

async function captureBracketUi(page, stageIndex) {
  const card = page.locator('.card.card-huge.card-outline').nth(stageIndex);
  const text = await card.innerText();
  const sideButtons = await page.locator(`[id^="btn-stage-${stageIndex}-side-"]`).evaluateAll(els =>
    els.map(el => ({ id: el.id, disabled: el.disabled, text: el.textContent?.trim() })),
  );
  const buildFinals = await page.locator(`#btn-stage-${stageIndex}-build-next-round-elimination`).evaluateAll(els =>
    els.map(el => ({ id: el.id, disabled: el.disabled })),
  );
  const headings = text.split('\n').filter(line =>
    /round|finals|side|bracket|elimination|gold|bronze/i.test(line),
  ).slice(0, 40);
  return { sideButtons, buildFinals, headings, excerpt: text.slice(0, 2000) };
}

async function capturePublicPage(page, tournamentId, nominationId) {
  await page.goto(`${base}/tournaments/${tournamentId}/nominations/${nominationId}`);
  await page.waitForTimeout(1_000);
  const headings = await page.getByRole('heading').allTextContents();
  const bodyExcerpt = (await page.locator('body').innerText()).slice(0, 3000);
  return { headings, bodyExcerpt };
}

async function main() {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  let tournamentId = null;
  let nominationId = null;

  try {
    await login(page);
    const headers = await authHeaders(page);
    const created = await createProbeTournament(page, headers);
    tournamentId = created.tournament._id;
    nominationId = created.nomination._id;
    report.tournamentId = tournamentId;
    report.nominationId = nominationId;

    report.enrolledCount = PARTICIPANTS;
    try {
      await enrollFromCache(page, nominationId, PARTICIPANTS, headers);
      report.enrollSource = 'api-cache';
    } catch (err) {
      report.enrollApiError = String(err);
      await enrollViaUi(page, tournamentId, nominationId, PARTICIPANTS);
      report.enrollSource = 'ui';
    }

    await page.goto(`${base}/organizer/tournaments/${tournamentId}/nominations/${nominationId}/stages`);
    await page.waitForTimeout(1_000);
    report.stagesPageUrl = page.url();
    report.stagesPageTitle = await page.title();

    const addBtn = page.locator('#btn-stage-add');
    await addBtn.waitFor({ state: 'visible', timeout: 60_000 });
    await addBtn.click();
    await page.locator('#input-stage-type-POOL').check();
    await page.locator('#input-stage-fightTime').fill(String(FIGHT_TIME));
    await page.locator('#btn-stage-editing-save').click();
    await page.waitForTimeout(800);

    // Double elimination stage
    await page.locator('#btn-stage-add').click();
    await page.locator('#input-stage-type-ELIMINATION_DOUBLE').check();
    await page.waitForTimeout(500);
    const addForm = page.locator('.card.card-huge.card-outline').last();
    report.doubleElimAddForm = await captureFormFields(addForm);
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, '01-double-elim-add-form.png'), fullPage: true });
    await page.locator('#btn-stage-editing-save').click();
    await page.waitForTimeout(800);

    report.stageTitles = await page.locator('.card.card-huge.card-outline .h3').allTextContents();

    // Pool edit — goes next stage options
    await page.locator('#btn-_stage-0-edit').click();
    await page.waitForTimeout(500);
    const editForm = page.locator('.card.card-huge.card-outline').last();
    report.poolEditForm = {
      fields: (await captureFormFields(editForm)).fields,
      outputCountRadios: await listVisibleRadios(page, 'input-stage-outputCount-'),
      minimumFromPoolRadios: await listVisibleRadios(page, 'input-stage-minimumFromEachPool-'),
    };
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, '02-pool-edit-goes-next.png'), fullPage: true });
    await page.locator('#btn-stage-editing-cancel').click();
    await page.waitForTimeout(300);

    // All 16 fighters advance to double elimination brackets
    await setGoesNextStage(page, PARTICIPANTS);
    report.goesNextStageSet = PARTICIPANTS;

    // Seed pools (3 pools × ~5–6 fighters avoids empty trailing pool)
    for (let i = 0; i < POOL_COUNT; i++) {
      await page.locator('#btn-stage-0-add-pool').click();
      await page.waitForTimeout(200);
    }
    await page.getByText('Seed randomly', { exact: true }).click();
    await page.waitForTimeout(1_000);
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, '03-pools-seeded.png'), fullPage: true });

    const reopenStages = async () => {
      await page.goto(`${base}/organizer/tournaments/${tournamentId}/nominations/${nominationId}/stages`);
      await page.waitForTimeout(500);
    };

    await conductAllPools(page, reopenStages);
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, '04-pools-conducted.png'), fullPage: true });

    // Capture pool stage API before build
    const stagesBefore = await page.request.get(`${base}/api/organizer/stages/${nominationId}`, { headers });
    report.poolStageBeforeBuild = summarizeStage((await stagesBefore.json()).find(s => s.type === 'POOL'));

    // Build next stage
    const buildBtn = await waitForBuildNextStageEnabled(page);
    try {
      const buildResponsePromise = page.waitForResponse(
        r => r.request().method() === 'POST'
          && r.url().includes('/api/organizer/stages/build-next-stage')
          && r.ok(),
        { timeout: 120_000 },
      );
      await buildBtn.click();
      const buildResponse = await buildResponsePromise;
      report.buildNextStage = {
        status: buildResponse.status(),
        body: await buildResponse.json().catch(() => null),
      };
    } catch (buildErr) {
      report.buildNextStage = { error: String(buildErr) };
    }

    if (!report.buildNextStage?.status) {
      throw new Error('build-next-stage did not complete');
    }
    await page.waitForTimeout(1_500);
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, '05-after-build-next-stage.png'), fullPage: true });

    const stagesRes = await page.request.get(`${base}/api/organizer/stages/${nominationId}`, { headers });
    const stages = await stagesRes.json();
    fs.writeFileSync(
      path.join(SNAPSHOT_DIR, 'stages-after-build.json'),
      JSON.stringify(stages, null, 2),
    );

    const poolStage = stages.find(s => s.type === 'POOL');
    const deStage = stages.find(s => s.type === 'ELIMINATION_DOUBLE');
    report.stagesAfterBuild = {
      types: stages.map(s => s.type),
      pool: summarizeStage(poolStage),
      doubleElim: summarizeStage(deStage),
    };

    // Rating split analysis
    if (poolStage && deStage) {
      const poolTallies = new Map();
      for (const pool of poolStage.pools) {
        for (const fight of pool.fights ?? []) {
          for (const slot of ['fighter1', 'fighter2']) {
            const f = fight[slot];
            const id = stageUserId(f?.user);
            if (!id) continue;
            if (!poolTallies.has(id)) {
              poolTallies.set(id, { id, name: stageUserName(f.user), wins: 0, losses: 0, points: 0 });
            }
            const t = poolTallies.get(id);
            t.points += f.scores ?? 0;
            if (fight.result === 'F1_WIN' && slot === 'fighter1') t.wins++;
            if (fight.result === 'F2_WIN' && slot === 'fighter2') t.wins++;
            if (fight.result === 'F1_WIN' && slot === 'fighter2') t.losses++;
            if (fight.result === 'F2_WIN' && slot === 'fighter1') t.losses++;
          }
        }
      }
      const ranked = [...poolTallies.values()].sort((a, b) => b.wins - a.wins || b.points - a.points);
      const entrantIds = new Set(
        deStage.pools
          .filter(p => p.round === 0 && p.side !== 2)
          .flatMap(p => (p.users ?? []).map(stageUserId)),
      );
      const upperSide = deStage.pools.filter(p => p.round === 0 && p.side === 0).flatMap(p => p.users.map(stageUserId));
      const lowerSide = deStage.pools.filter(p => p.round === 0 && p.side === 1).flatMap(p => p.users.map(stageUserId));

      report.ratingSplit = {
        rankedTop8: ranked.slice(0, 8).map(r => ({ name: r.name, wins: r.wins, points: r.points, inBracket: entrantIds.has(r.id) })),
        rankedBottom8: ranked.slice(8).map(r => ({ name: r.name, wins: r.wins, points: r.points, inBracket: entrantIds.has(r.id) })),
        upperSideCount: upperSide.length,
        lowerSideCount: lowerSide.length,
        totalEntrants: entrantIds.size,
        upperInTopHalf: upperSide.filter(id => ranked.slice(0, 8).some(r => r.id === id)).length,
        lowerInBottomHalf: lowerSide.filter(id => ranked.slice(8).some(r => r.id === id)).length,
      };
    }

    report.bracketUi = await captureBracketUi(page, 1);
    report.publicPage = await capturePublicPage(page, tournamentId, nominationId);
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, '06-public-page.png'), fullPage: true });

  } catch (err) {
    report.errors.push(String(err?.stack || err));
    report.failureUrl = page.url();
    report.failureText = await page.locator('body').innerText().catch(() => '');
    await page.screenshot({ path: path.join(SNAPSHOT_DIR, 'error.png'), fullPage: true }).catch(() => {});
  } finally {
    fs.writeFileSync(
      path.join(OUT_DIR, 'double-elimination-report.json'),
      JSON.stringify(report, null, 2),
    );

    if (tournamentId) {
      const headers = await authHeaders(page).catch(() => null);
      if (headers) {
        await page.request.delete(`${base}/api/organizer/tournaments/${tournamentId}`, { headers }).catch(() => {});
      }
    }
    await browser.close();
  }

  console.log(JSON.stringify(report, null, 2));
  process.exit(report.errors.length ? 1 : 0);
}

main();
