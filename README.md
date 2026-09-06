# Hemagon Playwright Tests

Playwright + TypeScript + Allure + Zod test suite for [Hemagon stage](https://stage.hemagon.com/).

## Quick start

```bash
npm install   # also installs Chromium via postinstall

cp .env.example .env   # fill ORGANIZER_EMAIL / ORGANIZER_PASSWORD

make browsers          # or: npm run browsers — if UI fails: chromium_headless_shell missing
npm run test:api       # API tests
npm run test:ui:fast   # UI tests without the long tournament matrices
npm run test:scenarios # only the @scenario tournament matrices (~8 min)
npm run test:ui        # all UI tests
npm test               # all projects

npm run allure:report  # generate + open Allure report

npm run typecheck      # tsc --noEmit
npm run lint           # ESLint
make check             # typecheck + lint (no browser needed)
```

## Environment

| Variable | Purpose |
| -------- | ------- |
| `BASE_URL` | Root URL (default `https://stage.hemagon.com`) |
| `ORGANIZER_EMAIL` | Organizer login email |
| `ORGANIZER_PASSWORD` | Organizer login password |

**Environment rule:** prod stays read-only. Stage is available for login, API probing, and upcoming mutation/scenario work.

## Project layout

```
src/
├── data/           Credentials, endpoints, payload builders, timeouts, stage arithmetic
├── schemas/        Zod — API responses + scenario configs
├── factories/      REST clients (tournaments, rings, nominations, stages)
├── fixtures/       test (unified entry), api auth, resource tracker
├── helpers/        cleanup, API/UI reporting, assertOk, submitAndCapture, randomCode
├── flows/          Full tournament lifecycles: poolsElimination, swiss
├── validation/     Expectations recomputed from API data (fightTally, elimination, swiss)
└── ui/             Page objects, sections, selectors

scenarios/
├── pools-elimination/  8 JSON configs
└── swiss/              6 JSON configs

tests/
├── UI/             browser UI tests
└── API/            API tests (incl. fast scenario-schema and capacity guards)
```

All specs import `test`/`expect` from `src/fixtures/test.ts`. It provides:

- a proxied `request` that attaches every API call to Allure (API **and** UI tests);
- an authenticated `api` (tournament/ring/nomination factories);
- a `resources` tracker that tears down created data in reverse order and attaches cleanup failures to the report.

## CI

On every **push** and **pull request**, a single workflow runs (`.github/workflows/ci.yml`):

1. **Typecheck & Lint** (~30 s)
2. **Full suite in Docker** — all 48 tests including `@scenario` matrices (~8 min) + Allure HTML artifact

Download **allure-report** from the workflow run to browse results offline. GitHub Pages deploy (job **Publish Allure to GitHub Pages**) works only on public repos or Enterprise — otherwise use the artifact.

Locally: `make docker.test` (needs `.env`), then open `allure-report/index.html`.

Secrets: `BASE_URL`, `ORGANIZER_EMAIL`, `ORGANIZER_PASSWORD`. Participant pool is cached between runs — bump `PARTICIPANT_POOL_CACHE_KEY` in the workflow to force a reseed.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full plan.

### Allure tree shows file paths

By default Allure used file-based suites. The project sets `suiteTitle: false` in `playwright.config.ts`, so the report groups tests by `test.describe` (e.g. **Tournament areas page**) under the **UI** / **API** project, not by `UI/tournament/areas.spec.ts`.

### UI tests fail: browser executable missing

Playwright downloads Chromium into `~/.cache/ms-playwright/`, versioned per `@playwright/test` release (e.g. `chromium_headless_shell-1223`). API tests do not need a browser; all `[UI]` failures with `browserType.launch: Executable doesn't exist` mean the cache is outdated.

Typical causes:

- `npm update` / caret range (`^1.59.1`) pulled a newer Playwright without re-running `postinstall`
- `npm install --ignore-scripts` skipped `postinstall`
- first UI run on a new machine or WSL profile

Fix:

```bash
make browsers
# or: node node_modules/playwright/cli.js install chromium
```
