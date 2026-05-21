import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gql, endpoints } from './helpers/graphql/graphqlhelper.js';

//We must be able to read the fields the Best Seller card needs from the Rocket schema.

//This test ensures that if SpaceX changes their schema, 
//we'll know about it and can update our code accordingly.

test('Verify Rocket Type Defines: ID, name, active, and success_rate_pct with correct GraphQL types', async () => {
  const { json } = await gql(endpoints.spacex, `
    query {
      __type(name: "Rocket") {
        name
        fields { name type { name ofType { name } } }
      }
    }
  `);

  const rocket = json.data.__type;
  assert.equal(rocket.name, 'Rocket');
  assert.ok(Array.isArray(rocket.fields) && rocket.fields.length > 0);

  // Look up a field by name and return the name of its GraphQL type.
  function getFieldType(fieldName) {
    const field = rocket.fields.find((f) => f.name === fieldName);
    if (!field) return undefined;
    if (field.type.name) return field.type.name;
    return field.type.ofType ?.name;
  }

  assert.equal(getFieldType('id'), 'ID');
  assert.equal(getFieldType('name'), 'String');
  assert.equal(getFieldType('active'), 'Boolean');
  assert.equal(getFieldType('success_rate_pct'), 'Int');
});
