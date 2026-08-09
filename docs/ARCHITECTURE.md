# Hemagon Playwright — Architecture

Tournament simulation framework on Playwright. Full phased plan: see project plan in `.cursor/plans/`.

## Layers

| Layer | Path | Role |
|-------|------|------|
| Tests | `tests/` | Declarative specs split only by runner type: `API` and `UI` |
| Fixtures | `src/fixtures/` | Unified `test` (proxied `request` + `api` + `resources`), auth |
| Scenarios | `scenarios/` | Declarative JSON tournament configs (validated by Zod schemas) |
| Flows | `src/flows/` | Reusable lifecycles: `poolsElimination.flow.ts`, `swiss.flow.ts` |
| UI | `src/ui/` | Page objects + components + selectors |
| API | `src/factories/` | POST/GET/DELETE + Zod validation (tournament, ring, nomination) |
| Helpers | `src/helpers/` | cleanup, API/UI reporting, `assertOk`, `submitAndCapture` |
| Schemas | `src/schemas/` | Zod — API responses + scenario DSL (`scenarioBase` + one per matrix) |
| Validation | `src/validation/` | Expectations recomputed from API data: `fightTally` (shared), `elimination`, `swiss` |

## Conventions

- Specs import `test`/`expect` from `src/fixtures/test.ts` only.
- Endpoints live in `src/data/endpoints.ts`; factories and UI waits reference them, never raw strings.
- Factories never throw ad-hoc: they use `assertOk` and return Zod-parsed bodies; `delete*` returns `CleanupResult`.
- Resource teardown goes through `resources` (reverse order); failures are attached to Allure, not silently dropped.
- Scenario schemas are strict: a misspelled key in a JSON file is an error, never a silently ignored field.
- Anything a formula can derive stays out of the JSON (Swiss round count, for one) so configs cannot drift from the product's own arithmetic.

## Current Phase

Two declarative matrices are implemented, each following the same shape: a JSON
directory under `scenarios/`, a Zod schema that rejects impossible configs, a flow
that drives the lifecycle, and a spec tagged `@scenario` that generates one test per
file. Schema sanity specs under `tests/API/` fail fast on broken JSON so a typo never
costs a full UI run, and `scenario-capacity.spec.ts` checks the shared participant pool
is large enough for the biggest roster before any browser opens.

**Pools → Elimination** — `scenarios/pools-elimination/*.json` drives
`src/flows/poolsElimination.flow.ts`: pools seeding and conduct, bracket build, every
round through gold/bronze finals. API assertions cover the advance count, the
per-pool minimum, that nobody left behind in a pool outranks a fighter who advanced,
and that every bracket bout is decided — with the gold-fight winner topping the
published final standings.

**Swiss system** — `scenarios/swiss/*.json` drives `src/flows/swiss.flow.ts`: enroll
the roster, then conduct round after round, appending each next pairing via
`POST /organizer/stages/build-next-round-swiss`. Round count follows the product's
"Recommended rounds" readout, `ceil(log2(N)) + 2`, and is derived rather than
configured (see `src/data/swissData.ts`). An odd roster adds one auto-resolved empty
fight per round, so a round holds `ceil(N/2)` fights but only `floor(N/2)` conductable
bouts. `src/validation/swiss.validator.ts` recomputes standings from the API fight
documents, checks the two properties that make a pairing Swiss rather than random — no
pair ever meets twice, nobody sits out twice — and requires all three views to agree:
the organizer Rating modal, the public Rating tab, and public Final standings.

Both matrices share `src/validation/fightTally.ts`, which folds `stage.pools[].fights[]`
into per-fighter wins, losses and scored points; POOL round-robins and SWISS rounds use
the same document shape, so ranking arithmetic lives in one place.

**Next:** double-elimination flow; drop-out-fighter coverage on Swiss.

## References

- Architecture template: `LSMP_Playwright`
- Legacy scenarios: `Hemagon_OLD/hemagon-test-selenium-main`
