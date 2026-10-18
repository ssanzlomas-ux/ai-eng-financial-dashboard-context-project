# Frontend Data Contract

## Scope and status

This document specifies the frontend data contract for the date filter, anomaly alerts, and B2B/B2C comparison. It does not claim these features are implemented: the current dashboard consumes only `GET /api/metrics`. No React components, fetch calls, routes, or backend changes are part of this document.

The contracts below were checked against FastAPI Swagger at `http://localhost:8000/docs` and its OpenAPI document at `http://localhost:8000/openapi.json` on 2026-10-18. The API returns simulated movements.

TypeScript contracts are in `api-types.ts`, `param-types.ts`, and `../src/lib/financial-types.ts`. TypeScript describes the expected shape but does not validate JSON or date strings at runtime.

## 1. Dashboard date filter

### Endpoints and types

| Endpoint | Request type | Response type | Purpose |
|---|---|---|---|
| `GET /api/metrics/facets` | No query parameters | `FacetsResponse` | Provides global filter options and dataset date bounds. |
| `GET /api/metrics` | `DateRangeFilter` for the date controls; the endpoint also accepts optional `category?: Category` and `operation_type?: OperationType` filters. | `FinancialMovement[]` | Returns chronologically ordered movements used to calculate the existing KPIs and charts. |

`FinancialMovement` is defined in `../src/lib/financial-types.ts` and contains the required fields `create_date: string`, `amount: number`, `operation_type: OperationType`, `category: Category`, and `business_type: BusinessType`.

`FacetsResponse` contains required arrays `operation_types`, `business_types`, and `categories`, plus `min_date` and `max_date`. The valid values are `income|outcome`, `B2B|B2C`, and `suppliers|sales|operational|administrative|others`. The dates use the API date format `YYYY-MM-DD`.

### Request parameters and rules

| Parameter | TypeScript type | Required | API constraints |
|---|---|---:|---|
| `start_date` | `DateRangeFilter['start_date']` (`string`) | No | Date in `YYYY-MM-DD`; inclusive lower bound. No API default or date-range limit is declared. |
| `end_date` | `DateRangeFilter['end_date']` (`string`) | No | Date in `YYYY-MM-DD`; inclusive upper bound. No API default or date-range limit is declared. |
| `category` | `Category` | No | `suppliers`, `sales`, `operational`, `administrative`, or `others`. Not part of `DateRangeFilter`. |
| `operation_type` | `OperationType` | No | `income` or `outcome`. Not part of `DateRangeFilter`. |

`DateRangeFilter` models the optional date bounds used by this feature. Empty inputs omit their query parameter. If only one bound is set, the API applies only that bound. If both are set, both bounds are inclusive. With both empty, `/api/metrics` returns all available movements. `min_date` and `max_date` from facets refer to the complete dataset, not the selected date range.

### UI states and edge cases

- **Loading facets:** keep the filter area stable and show a loading state until `FacetsResponse` is available.
- **Facet request error:** show an error and a retry action; do not present stale bounds as current.
- **No date filters:** omit both parameters and calculate KPIs/charts from all returned movements.
- **Only start or only end:** send only the supplied bound and update all existing KPIs/charts from the filtered movements.
- **Inverted range (`start_date > end_date`):** reject locally, show a validation message, and do not request data. The current backend does not reject the range and returns `200 []`; repository rules require a `422` contract, so the UI must not rely on the current empty response as validation.
- **Valid range with no matches:** the API returns `[]`; retain the page structure and show the established empty state instead of treating it as a request error.

`YYYY-MM-DD` is the API contract. A TypeScript `string` does not enforce that format at runtime; the input and request construction must preserve it.

## 2. Anomaly alerts

### Endpoint and types

`GET /api/metrics/alerts` returns `AlertsResponse`, an array of `AlertEntry` values:

| Field | TypeScript type | Meaning |
|---|---|---|
| `period` | `string` | Period key: `YYYY-MM-DD` for day, `YYYY-Www` for ISO week, or `YYYY-MM` for month. |
| `outcome_total` | `number` | Outcome amount for the period. |
| `baseline_average` | `number` | Baseline average used by the current API. |
| `increase_ratio` | `number` | Relative increase as a decimal ratio; for example, `0.3` is 30%. |

All four response fields are required. Query parameters map to `AlertsParams`.

### Request parameters and rules

| Parameter | TypeScript type | Required | API constraints |
|---|---|---:|---|
| `threshold` | `number` | No | Minimum `0`, default `0.3`; OpenAPI declares no maximum. |
| `group_by` | `'day' \| 'week' \| 'month'` | No | Default `month`. |
| `start_date` | `DateRangeFilter['start_date']` (`string`) | No | `YYYY-MM-DD`; inclusive lower bound. |
| `end_date` | `DateRangeFilter['end_date']` (`string`) | No | `YYYY-MM-DD`; inclusive upper bound. |
| `business_type` | `BusinessType` | No | `B2B` or `B2C`. |

The PM's numeric control is narrower than the API: the UI accepts `0.01` through `1.0`, default `0.3`. This is a UI constraint, not an API maximum. An alert is returned only when the baseline is positive and `increase_ratio > threshold` (strictly greater). Display `increase_ratio * 100` as a percentage; do not send the displayed percentage in place of the ratio.

### Baseline discrepancy

Current API behavior: `baseline_average` is the arithmetic mean of all earlier periods present in the summary after the date filter has been applied. It is not a rolling average of the three previous periods. Applying the date filter first also excludes periods before the selected start date from that baseline.

PM requirement: compare each period against the three immediately preceding periods. To meet it, the calculation/contract must be adapted to include the three earlier periods even when they precede the visible range, while returning alert rows only for the selected range. Until that is implemented, do not label the current `baseline_average` as a three-period average. The response field name remains `baseline_average`; no additional API response field is defined here.

### UI states and edge cases

- **Loading:** show a table skeleton while the request is pending.
- **Request error:** keep the table area visible, show an error and retry action, and do not replace the error with an empty result.
- **Empty response:** for `[]`, retain the four column headers and show `No alerts for the selected range and threshold.`
- **Baseline is zero:** the current backend emits no alert for a zero baseline; present no row for that period. Do not divide by zero or show `NaN`/infinity.
- **Ratio equals threshold:** no alert is returned because the comparison is strictly `>`; it is not inclusive.
- **Date-filtered range:** send the same active date bounds used by the dashboard. Document that the current API baseline then only includes earlier periods remaining after filtering; this does not satisfy the PM's three-period requirement.

## 3. B2B/B2C income comparison

### Endpoints and types

| Endpoint | Request type | Response type | Purpose |
|---|---|---|---|
| `GET /api/metrics/facets` | No query parameters | `FacetsResponse` | Supplies global categories and the global date bounds. |
| `GET /api/metrics/categories/top` | `TopCategoriesParams` | `TopCategoriesResponse` | Supplies income totals by category for one business type. Call once for B2B and once for B2C. |

`TopCategoriesResponse` is an array of `CategoryEntry`; each item has required `category: Category`, `operation_type: OperationType`, and `total_amount: number`. The endpoint sorts by total descending and returns only categories with movements; it can return fewer items than `limit`, including an empty array.

`FacetsResponse.categories` is the global category catalog, not a per-business result. A category being in facets does not mean that it has income for both businesses. The comparison tables show returned category entries only; they do not add zero-valued rows for absent categories.

### Request parameters and rules

Make two `/api/metrics/categories/top` requests with the same date bounds:

| Request | `operation_type` | `limit` | `business_type` |
|---|---|---:|---|
| B2B income categories | `income` | `5` | `B2B` |
| B2C income categories | `income` | `5` | `B2C` |

`TopCategoriesParams` fields:

| Parameter | TypeScript type | Required | API constraints |
|---|---|---:|---|
| `operation_type` | `OperationType` | No | `income` or `outcome`; default `outcome`. The comparison explicitly sends `income`. |
| `limit` | `number` | No | Integer from `1` to `20`; default `5`. The comparison explicitly sends `5`. |
| `start_date` | `DateRangeFilter['start_date']` (`string`) | No | `YYYY-MM-DD`; inclusive lower bound. |
| `end_date` | `DateRangeFilter['end_date']` (`string`) | No | `YYYY-MM-DD`; inclusive upper bound. |
| `business_type` | `BusinessType` | No | `B2B` or `B2C`; send one value per request. |

### Derived values, navigation, and UI states

For each business, calculate `groupTotal` as the sum of its returned `total_amount` values. For each category, calculate `percentage = total_amount / groupTotal * 100`. Format totals as currency and percentages as percentages. The one chart compares the two `groupTotal` values.

The page route is `/comparison`, linked from the dashboard navigation and directly addressable with browser back/forward support. This is a product requirement only: the current frontend has no router. This contract does not select or implement a routing library.

- **Loading:** show independent table loading states for B2B and B2C; show the comparison chart loading state until both totals can be computed.
- **One group is empty:** that table keeps its heading and shows `No income categories for this group and range.` Its total is `0`; the other group's table remains usable.
- **Group total is zero:** show total `0` and percentage `N/A`; never divide by zero.
- **Partial request failure:** preserve the successfully loaded group's table, show an error and retry action for the failed group, and do not present a misleading complete comparison chart.
- **Both groups empty:** both tables show their empty states and the chart indicates there is no comparison data; do not invent category rows.

### Why `/api/metrics/comparison` is not used

`GET /api/metrics/comparison` requires `start_date` and `end_date`, accepts an optional `business_type`, and returns `current_period`, `previous_period`, `delta_abs`, and nullable `delta_pct`. Those values compare net amounts (`income - outcome`) across the current and previous date periods for at most one business filter. It does not compare gross income for B2B against gross income for B2C, so this view must use the two `categories/top` requests instead. No matching frontend response type is defined in Phase 2 because this endpoint is not used by the feature.

## Current implementation boundary

The current frontend does not consume facets, alerts, top categories, or comparison; it has no `/comparison` route. This document specifies the intended frontend contract and UI states only. It does not connect API calls, create components, alter API behavior, or claim the three features are implemented.