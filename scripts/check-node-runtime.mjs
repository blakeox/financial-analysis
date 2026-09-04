import { readFileSync } from 'node:fs';

const nvmrc = readFileSync(new URL('../.nvmrc', import.meta.url), 'utf8').trim();
const expectedMajor = Number.parseInt(nvmrc.replace(/^v/, ''), 10);
const actualMajor = Number.parseInt(process.versions.node, 10);
const isSupportedLtsMajor = actualMajor >= expectedMajor && actualMajor % 2 === 0;

if (!Number.isInteger(expectedMajor) || !Number.isInteger(actualMajor)) {
  console.error('Unable to determine the repository or active Node.js major version.');
  process.exitCode = 1;
} else if (!isSupportedLtsMajor) {
  console.error(
    [
      `Node.js ${process.versions.node} is not a supported LTS runtime for this repository.`,
      `Use Node.js ${expectedMajor} from .nvmrc locally (for example: volta run --node ${expectedMajor} pnpm run verify).`,
      'The controlled NUC may use the next even-numbered LTS major, but odd-numbered Node releases are rejected.',
      'This check prevents dependency and Astro runner failures from being reported as application failures.',
    ].join('\n')
  );
  process.exitCode = 1;
} else {
  console.log(
    `Node.js runtime check passed: ${process.versions.node} (local pin: ${nvmrc}; supported LTS major)`
  );
}
