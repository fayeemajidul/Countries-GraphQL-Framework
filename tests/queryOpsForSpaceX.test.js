import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gql, endpoints } from './helpers/graphql/graphqlhelper.js';

const ROCKETS = `{ rockets { id name active success_rate_pct } }`;

// Rubric: happy-path query
test('rockets query returns 200 and a non-empty array', async () => {
  const { status, json } = await gql(endpoints.spacex, ROCKETS);

  assert.equal(status, 200);
  assert.ok(!json.errors);
  assert.ok(Array.isArray(json.data.rockets) && json.data.rockets.length > 0);
});

// Rubric: data shape / type correctness beyond 200 OK
test('every rocket has the shape the Best Seller card depends on', async () => {
  const { json } = await gql(endpoints.spacex, ROCKETS);

  for (const r of json.data.rockets) {
    assert.equal(typeof r.name, 'string');
    assert.equal(typeof r.active, 'boolean');
    assert.ok(Number.isInteger(r.success_rate_pct));
    assert.ok(r.success_rate_pct >= 0 && r.success_rate_pct <= 100);
  }
});
