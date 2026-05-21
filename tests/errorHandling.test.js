import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gql, endpoints } from './helpers/graphql/graphqlhelper.js';

// We Should be Returning Errors When We Ask for Fields That Don't Exist.
test('querying a field that does not exist on Rocket produces a GraphQL error', async () => {
  const {json} = await gql(endpoints.spacex, `query { rockets { id population } }`);
  assert.ok(Array.isArray(json.errors) && json.errors.length > 0);
});
