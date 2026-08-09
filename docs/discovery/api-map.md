# API map (discovery)

Observed on prod (`https://hemagon.com`) during Phase 0 and confirmed on stage (`https://stage.hemagon.com`) for Phase 1.

## Auth

| Method | Path | Body | Response |
|--------|------|------|----------|
| POST | `/api/auth/login` | `{ "email": "...", "password": "..." }` | `200` + user JSON body |

**JWT location:** response header `Authorization` (raw JWT string, **no** `Bearer` prefix).

Example user fields: `_id`, `name`, `username`, `role` (`ORGANIZER`), `country`, `city`, `license`.

**Important:** subsequent API calls must send:

```
Authorization: <raw-jwt>
```

Using `Bearer <jwt>` returns `403 Authorization required` for organizer endpoints.

## Organizer (authenticated)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/organizer/tournaments` | Returns `{ items, count }` |
| GET | `/api/organizer/tournaments/:id` | Returns full organizer tournament document |
| POST | `/api/organizer/tournaments` | Creates tournament; UI then creates a default area/ring |
| DELETE | `/api/organizer/tournaments/:id` | Deletes tournament; returns deleted tournament JSON |
| GET | `/api/organizer/areas?perPage=all` | Returns `{ items, count }`; filter client-side by `area.tournament` |
| GET | `/api/organizer/areas?sort=title&page=1&perPage=100&filter=tournament:<id>` | UI areas list for a tournament |
| POST | `/api/organizer/areas` | Creates ring/area for tournament |
| DELETE | `/api/organizer/areas/:id` | Deletes ring/area; empty `200` body observed |
| GET | `/api/organizer/nominations/:id` | Returns full organizer nomination document |
| POST | `/api/organizer/nominations` | Creates category/nomination |
| DELETE | `/api/organizer/nominations/:id` | Deletes category/nomination; returns deleted nomination JSON |

## Tournament creation (stage UI)

Observed from `https://stage.hemagon.com/organizer/tournaments/new/settings`.

Required visible fields for minimal creation:

| Field | Selector / UI note | Observed default |
|-------|--------------------|------------------|
| Tournament purpose | `#input-tournament-test-true` / `#input-tournament-test-false` | `Testing` selected |
| Title | `#input-tournament-title` | required, blank |
| URL slug | `#input-tournament-id-string` | generated from title |
| Start date | date input | current date |
| End date | date input | current date |
| Country | async combobox | current user country (`Georgia`) |
| City | async combobox | current user city (`Tbilisi`) |

Minimal `POST /api/organizer/tournaments` body observed:

```json
{
  "idString": "autotest-discovery-script-1779899594871",
  "title": "AUTOTEST Discovery Script 1779899594871",
  "description": "",
  "descriptionPayment": "",
  "dateStart": "2026-05-27T16:33:14.115Z",
  "dateEnd": "2026-05-27T16:33:14.115Z",
  "registrationDateStart": "2026-05-27T16:33:14.115Z",
  "registrationDateEnd": "2026-05-27T16:33:14.115Z",
  "country": { "label": "Georgia", "value": "GE" },
  "city": { "label": "Tbilisi", "value": "3453056" },
  "address": "",
  "map": "",
  "test": true,
  "imagePreview": "",
  "imageApp": "",
  "stream": "",
  "link": null,
  "state": "DEVELOPING",
  "nominations": [],
  "applicationsAccess": "APPROVED",
  "applicationsShowPayments": false,
  "applicationsShowWaitingList": false,
  "approvalRequestSent": false,
  "zone": null,
  "keyboardSettings": {
    "pointLeftAdd": "KeyQ",
    "pointLeftRemove": "KeyA",
    "pointRightAdd": "BracketRight",
    "pointRightRemove": "Quote",
    "toggleTimer": "Space",
    "doubleAdd": "KeyY",
    "doubleRemove": "KeyH",
    "boutAdd": "KeyU",
    "boutRemove": "KeyJ"
  }
}
```

Observed create sequence:

1. `POST /api/organizer/tournaments` returns `200` with `_id`, `id`, `idString`, tournament data, `author`, image proxy paths.
2. UI navigates to `/organizer/tournaments/:id`.
3. UI sends `POST /api/organizer/areas` with `{ "title": "Default Ring", "tournament": "<tournament-id>" }`.

Cleanup sequence confirmed on stage:

1. `GET /api/organizer/areas?perPage=all`, then filter `items` where `tournament === <tournament-id>`.
2. `DELETE /api/organizer/areas/:id` for each matching area.
3. `DELETE /api/organizer/tournaments/:id`.

## Rings / areas (stage UI)

Observed from `/organizer/tournaments/:id/areas`.

UI list request:

```http
GET /api/organizer/areas?sort=title&page=1&perPage=100&filter=tournament:<tournament-id>
```

Minimal create body:

```json
{
  "title": "Discovery Ring",
  "tournament": "6a171d46073c34ce8937ebd9"
}
```

Response shape:

```json
{
  "_id": "6a171d69073c34ce8937ebe7",
  "title": "Discovery Ring",
  "tournament": "6a171d46073c34ce8937ebd9",
  "__v": 0
}
```

## Categories / nominations (stage UI)

Observed from `/organizer/tournaments/:tournamentId/nominations/new/settings`.

Required visible fields for minimal creation:

| Field | Selector / UI note | Observed default |
|-------|--------------------|------------------|
| Title | `#input-nomination-title` | required, blank |
| URL slug | `#input-nomination-slug` | generated from title |
| Fighting category | `#input-nomination-isfight-true` / `-false` | `Yes` |
| Weapon | native `<select id="input-nomination-weapon">` | options load after Fighting category = Yes; autotests use `Katana` |
| Team | `#input-nomination-isteam-true` / `-false` | `No` |
| 2/3-place | `#input-nomination-twoThirdPlace-true` / `-false` | `No` |
| Rating mode | `#input-nomination-rating-*` | `RATING_MODE_MATCH_POINTS` (leave default in tests) |
| Save | `#btn-nomination-save` | — |
| Fight time | `#input-nomination-time-fight` | `120` (not used in current UI POM) |
| Last round time | `#input-nomination-time-last-round` | `0` (not used in current UI POM) |

Minimal `POST /api/organizer/nominations` body observed:

```json
{
  "idString": "discovery-category-capture",
  "title": "Discovery Category Capture",
  "description": "",
  "fightTime": 120,
  "lastRoundTime": 0,
  "weapon": "5d6143d422d23c1d1834e882",
  "tournament": "6a171f69073c34ce8937ec15",
  "stages": [],
  "ratingMode": "RATING_MODE_MATCH_POINTS",
  "timeMode": "STRAIGHT",
  "showTimer": true,
  "showDoubles": false,
  "showBouts": false,
  "showAppeals": false,
  "showWarnings": false,
  "showWarnings2": false,
  "switchFightAndTeamScores": false,
  "isTeam": false,
  "redPosition": "RIGHT",
  "fightAddedValue": 1,
  "fightersLimit": 24,
  "twoThirdsPlace": false,
  "leftFighterColor": "red",
  "rightFighterColor": "blue",
  "isFightingNomination": true,
  "stopTimeOnScore": false
}
```

Create response returns `200` with `_id`, `idString`, `title`, populated `tournament`, populated `weapon`, `requests: []`, `stages: []`, timing/rating flags, and color/settings fields.

Confirmed detail and cleanup endpoints:

```http
GET /api/organizer/nominations/:id
DELETE /api/organizer/nominations/:id
```

## Public

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/tournaments?active=true&zone=...` | Tournament list |

## Probe script

```bash
npm run probe:login
```
