import test from 'node:test';
import assert from 'node:assert/strict';

import { greet } from '../src/index.js';

test('greet returns a personalized message', () => {
  assert.equal(greet('GitHub Actions'), 'Hola, GitHub Actions');
});