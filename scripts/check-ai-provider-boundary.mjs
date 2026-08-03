#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { relative } from 'node:path';
import { readdir } from 'node:fs/promises';

const root = process.cwd();
const allowed = 'workers/api/src/services/model-provider.ts';
const violations = [];

async function findTypeScriptFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) files.push(...(await findTypeScriptFiles(path)));
    else if (entry.isFile() && entry.name.endsWith('.ts')) files.push(path);
  }
  return files;
}

for (const file of await findTypeScriptFiles(`${root}/workers/api/src`)) {
  const relativePath = relative(root, file).replaceAll('\\', '/');
  if (relativePath === allowed) continue;
  const source = await readFile(file, 'utf8');
  if (/createWorkersAI|workers-ai-provider/.test(source)) {
    violations.push(relativePath);
  }
}

if (violations.length > 0) {
  console.error('Direct Workers AI provider construction is restricted to the model-provider seam:');
  for (const file of violations) console.error(`- ${file}`);
  process.exit(1);
}

console.log(`AI provider boundary check passed (${relative(root, `${root}/${allowed}`)} is the only construction seam).`);
