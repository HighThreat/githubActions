import { mkdir, readFile, writeFile } from 'node:fs/promises';

const distDir = new URL('../dist/', import.meta.url);

await mkdir(distDir, { recursive: true });

const sourceFile = new URL('../src/index.js', import.meta.url);
const sourceCode = await readFile(sourceFile, 'utf8');

await writeFile(new URL('bundle.js', distDir), `// Compiled from src/index.js\n${sourceCode}`);