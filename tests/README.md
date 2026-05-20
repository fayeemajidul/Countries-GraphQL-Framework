# tests/

This folder will hold the automated test suite for the project.

## Planned coverage (per JIRA [RECREW-150](https://recrewit-ai.atlassian.net/browse/RECREW-150))

- **Schema validation** — assert GraphQL responses match expected shape.
- **Happy path** — load app, answer correctly, score increments, next question loads.
- **Edge case** — intercept a launch with missing/unmappable country, assert graceful fallback.
- **Data shape** — validate Countries API fields (`code`, `name`, `emoji`, `continent`, `currency`) rendered in the reveal card match the underlying GraphQL payload.

## Bonus

- Filter-operator tests (`in`, `nin`, `regex`) against the Countries API.
- Latency assertion on the cold-load query.
- Consistency check between `Country.currency` (comma-separated string) and `Country.currencies` (array).

## Stack (TBD)

Likely Playwright for E2E + a lightweight GraphQL request helper for direct API-level assertions. Final choice owned by [RECREW-150](https://recrewit-ai.atlassian.net/browse/RECREW-150).
