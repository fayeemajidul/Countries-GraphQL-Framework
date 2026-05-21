# Scenario Strategy

Identify the business risks evaluates first, then test the
endpoint queries related to those areas.

Areas to pay attention to:

1. the "Best Seller" surface ranks rockets by success-rate. If that field disappears or is null, the
   customer sees a broken error message.


## Scenario 1: User can view the Best Seller highest success rate rocket (SpaceX)

|  |
|---|
| Endpoint: (`POST /api/spacex` that we can get with `spacex-api.fly.dev/graphql`) |
| Query:  `{ rockets { id name active success_rate_pct country } }` |
| Expected outcome: One rocket ranks highest by `success_rate_pct` and matches what the Best Seller section displays |

**Assertions the test script must make**

- HTTP `200` from the proxy.
- `data.rockets` is a non-empty array.
- Every element has `success_rate_pct` as an integer in `[0, 100]` (no nulls,
  no strings).
- `max(rockets.success_rate_pct)` is `>= 90` (best seller threshold).
- The rocket carrying that max value also has `active === true` and a
  non-empty `name` — those are the fields the Best Seller card reads.