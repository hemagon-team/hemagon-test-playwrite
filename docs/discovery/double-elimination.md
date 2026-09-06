# Discovery: Pools → Double Elimination

Phase 0 probe on `stage.hemagon.com` (2026-09-06).  
Raw artifacts: `double-elimination-report.json`, `double-elimination-snapshots/stages-after-build.json`.  
Re-run: `node scripts/discover-double-elimination.mjs`.

## Probe setup

| Parameter | Value |
|-----------|-------|
| Participants | 16 |
| Pools | 3 (seed randomly → 6+5+5) |
| Goes next stage | **16** (all fighters) |
| Stage 2 type | `ELIMINATION_DOUBLE` |
| Fight time | 120 s |

## Lifecycle (confirmed)

```
1. API: tournament (test) + nomination + enroll N
2. UI:  Add Pool stage → Add Double Elimination stage
3. UI:  Edit Pool → Goes next stage = N (all participants)
4. UI:  Add pools → Seed randomly → Conduct every pool (all fights done)
5. UI:  Build next stage          POST /api/organizer/stages/build-next-stage
6. UI:  Double Elim stage:
        - Winner Bracket R1: 8 fights (Left ×4 + Right ×4)
        - Loser Bracket R1:  empty ("No fights on loser bracket on first round")
        - BUILD NEXT ELIMINATION ROUND → advance both brackets
7. … conduct rounds until finals
8. Public page + Final standings
```

**Build next stage** stays disabled until **every** pool shows "All fights done" (including empty trailing pools — avoid extra empty pools in tests).

## Double Elimination add form

Type radio: `#input-stage-type-ELIMINATION_DOUBLE`.

| Field | Selector / values | Notes |
|-------|-------------------|-------|
| Fight time | `#input-stage-fightTime` | Same as other stages |
| Calculate stats from previous stages | checkbox | Visible on add form |
| To the finals | `#input-stage-tillFinals-true/false/abQualification` | Default **Yes** |
| Finals mode | `#input-stage-finalsMode-bo1` / `bo3` | Default **Best of 1** |

**Not on the form (unlike single Elimination):** no "Hold a fight for the third place" radio in UI.  
API still returns `settings.fightForThirdPlace: true` on the saved stage.

## Pool stage edit (before build)

Same as Pools → Elimination:

- **Goes next stage:** `#input-stage-outputCount-{2,4,8,16,32,64}` or `#input-stage-outputCount-num` for custom N
- **From each pool:** `#input-stage-minimumFromEachPool-{any,1,2,3,4,5}`

For "all advance": set `outputCount` to **participantsNumber** (e.g. 16).  
API confirms: `pool.settings.outputCount: 16`.

Default when Double Elim is stage 2: preset **8** is pre-selected — must be changed explicitly for full roster.

## Product model vs initial assumption

Initial assumption: *top half of rating → bracket A, bottom half → bracket B* (two parallel single-elim grids).

**Actual product behaviour:** classic **double elimination**:

| UI label | Round 1 |
|----------|---------|
| **Winner Bracket** | 8 fights — Left bracket ×4 + Right bracket ×4 |
| **Loser Bracket** | No fights ("No fights on loser bracket on first round") |

All **N** fighters enter the **Winner Bracket** with standard elimination seeding (1 vs 16, 8 vs 9, 4 vs 13, …). Losers drop into the Loser Bracket on later rounds.

## API after `build-next-stage`

Stage type: `ELIMINATION_DOUBLE`.

### Settings

```json
{
  "tillFinals": true,
  "finalsMode": "BO_1",
  "fightForThirdPlace": true,
  "fightTime": 120
}
```

### Bracket geometry (N = 16)

| Metric | Value |
|--------|-------|
| Round-0 entrants | **16** (all participants) |
| Round-0 fights | **8** |
| side **0** | Left bracket — 4 fights, `index` 0–3 |
| side **1** | Right bracket — 4 fights, `index` 0–3 |
| side **2** | Finals (not populated yet) |
| `floor` | 0 on round-0 bouts |

### Seeding (`usersPlaces`)

Standard power-of-two bracket seeds by **overall pool rating** (not "top 8 vs bottom 8"):

| Fight | usersPlaces | Example (probe run) |
|-------|-------------|------------------------|
| Left R1-1 | 1, 16 | Dhog Bukk vs Zavarak |
| Left R1-2 | 8, 9 | Ugluck vs Sharu |
| Left R1-3 | 4, 13 | Gorbag vs Tarrok |
| Left R1-4 | 5, 12 | Zhor vs Zorg |
| Right R1-1 | 2, 15 | Gun Chin vs Bolg |
| Right R1-2 | 7, 10 | Orkobal vs Globug |
| Right R1-3 | 3, 14 | Otrod vs Shagrat |
| Right R1-4 | 6, 11 | Ingwë vs Bug Bug |

Bout titles (RU): `Плейофф, 1/8, левая/правая сетка, бой N`.  
UI labels (EN): `Upper bracket, Left/Right bracket, Round 1, fight N`.

## UI differences from single Elimination

| Single Elim (`ELIMINATION`) | Double Elim (`ELIMINATION_DOUBLE`) |
|-----------------------------|-------------------------------------|
| One bracket, side 0/1 = halves | **Winner** + **Loser** bracket sections |
| `buildNextSideRound(0/1)` | **BUILD NEXT ELIMINATION ROUND** (single button, probe) |
| `#btn-stage-{n}-side-{s}-build-next-elimination-round` | Same endpoint family — verify per round in Phase 1 |
| Finals: gold + optional bronze | Finals mode BO1/BO3; loser bracket feeds in |
| `thirdPlace` radio on add form | Not exposed on add form |

## Endpoints (unchanged)

| Step | Endpoint |
|------|----------|
| Build bracket from pools | `POST /organizer/stages/build-next-stage` |
| Advance elimination round | `POST /organizer/stages/build-next-round-elimination` |
| List stages | `GET /api/organizer/stages/:nominationId` |

## Implications for test matrix

### Scenario schema (draft)

```json
{
  "id": "16p-3pool-all-de",
  "participantsNumber": 16,
  "poolsCount": 3,
  "thirdPlace": true,
  "finalsMode": "BO_1",
  "stageFightTime": 120
}
```

- **No `advanceCount`** — use `participantsNumber` as goes-next-stage value (all advance).
- **No `minimumFromEachPool`** for full-advance scenarios (or keep `any` if product allows).
- **`finalsMode`:** `BO_1` | `BO_3` (new field vs single elim).
- Pool size refine: `participantsNumber / poolsCount` within 4–6; avoid empty pools after seed.

### Validators (draft)

1. After build: exactly **N** unique entrants in winner bracket round 0.
2. Seeding: `usersPlaces` pairs match standard bracket table for N.
3. Loser bracket round 0: **no fights** (or zero decided bouts).
4. After full conduct: all bouts decided; gold winner tops Final standings.
5. Reuse `fightTally` for pool-phase rating before build.

### POM gaps

- `StageBuilderSection.doubleElimination({ fightTime, finalsMode?, tillFinals? })`
- `StageDoubleEliminationFormSection` — finals mode, till finals, stats checkbox
- `StageCardSection` — winner/loser bracket conduct; `buildNextEliminationRound()` (name TBD)
- Possibly extend `StageCardEliminationBracketSection` for "Upper/Lower bracket" labels
- `NominationPublicPage` — double elim public section

### Recommended first scenarios

| id | N | pools | notes |
|----|---|-------|-------|
| `16p-3pool-all-de` | 16 | 3 | Minimal happy path (probe config) |
| `24p-4pool-all-de` | 24 | 4 | 12+12 winner R1 = 12 fights |
| `32p-6pool-all-de` | 32 | 6 | Stress |

Power-of-two **N** is required for clean bracket (16/32). Non-power-of-two needs a separate discovery pass.

## Open questions for Phase 1

1. Exact round loop: one `BUILD NEXT ELIMINATION ROUND` vs per-side buttons after R1?
2. Grand finals / bracket reset when loser-bracket winner reaches winner-bracket winner?
3. Bronze fight — controlled by hidden `fightForThirdPlace` or absent in double elim?
4. Public page structure for winner + loser brackets.
5. `BO_3` finals — separate conduct flow?

## Related files

- Probe script: `scripts/discover-double-elimination.mjs`
- Existing template: `src/flows/poolsElimination.flow.ts`
- Stage type enum: `src/data/nominationStageData.ts` → `ELIMINATION_DOUBLE`
