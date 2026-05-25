import test from 'node:test';
import assert from 'node:assert/strict';
import { appName, buildMessage } from '../src/index.js';

test('exposes the application name', () => {
  assert.equal(appName, 'githubActions-secure-deployment-lab');
});

test('formats deployment messages', () => {
  assert.equal(buildMessage('staging'), 'Deploying githubActions-secure-deployment-lab to staging');
});