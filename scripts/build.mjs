import { mkdir, writeFile } from 'node:fs/promises';

await mkdir('dist', { recursive: true });

const bundle = [
  '// Generated bundle for the secure deployment lab',
  "export const appName = 'githubActions-secure-deployment-lab';",
  'export function buildMessage(targetEnvironment) {',
  "  return `Deploying ${appName} to ${targetEnvironment}`;",
  '}',
  ''
].join('\n');

await writeFile('dist/bundle.js', bundle, 'utf8');